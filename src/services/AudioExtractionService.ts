import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util'; // <--- Импорт из нового пакета

export class AudioExtractionService {
  // Создаем экземпляр класса, а не вызываем функцию
  private static ffmpeg = new FFmpeg(); // <--- Создание экземпляра класса

  static async extractAudioFromVideo(videoFile: File): Promise<AudioBuffer> {
    console.log('🎬 Extracting audio with ffmpeg.wasm...');

    // Загрузка теперь - это метод экземпляра, а не статический
    if (!this.ffmpeg.loaded) { // <--- Свойство `loaded` вместо `isLoaded()`
      await this.ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js' // <--- Явное указание URL
      });
    }

    // Запись файла в виртуальную ФС
    await this.ffmpeg.writeFile('inputVideo', await fetchFile(videoFile)); // <--- Метод `writeFile` вместо `FS`

    // Конвертация в wav
    await this.ffmpeg.exec([ // <--- Метод `exec` вместо `run`
      '-i', 'inputVideo',
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      'audio.wav'
    ]);

    const data = await this.ffmpeg.readFile('audio.wav'); // <--- Метод `readFile` вместо `FS`
    const blob = new Blob([data], { type: 'audio/wav' });

    // Decode to AudioBuffer to keep old API shape
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const arrayBuffer = await blob.arrayBuffer();
    
    // ✅ БАГ 3.2 ИСПРАВЛЕН: Ограничиваем длительность извлекаемого аудио
    const MAX_DURATION_SECONDS = 300; // 5 минут максимум
    const sampleRate = 16000;
    const maxSamples = MAX_DURATION_SECONDS * sampleRate;
    
    // Декодируем аудио с ограничением
    let audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Если аудио дольше максимума, обрезаем его
    if (audioBuffer.length > maxSamples) {
      console.warn(`⚠️ Audio duration (${(audioBuffer.length / sampleRate).toFixed(1)}s) exceeds maximum (${MAX_DURATION_SECONDS}s). Truncating...`);
      
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        maxSamples,
        sampleRate
      );
      
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineCtx.destination);
      source.start(0);
      
      audioBuffer = await offlineCtx.startRendering();
    }

    console.log('✅ Real audio extracted', { duration: audioBuffer.length / sampleRate });
    return audioBuffer;
  }
  /**
   * ✅ БАГ 3.1 ИСПРАВЛЕН: Интеллектуальная нарезка аудио без порчи WAV-заголовков
   * Снимает WAV-заголовок один раз ДО нарезки, затем режет сырые PCM данные
   */
  static async splitAudioIntoIntelligentChunks(audioBlob: Blob, chunkDuration: number = 10): Promise<Blob[]> {
    console.log(`📊 Splitting audio into ${chunkDuration}s chunks...`);
    
    // Читаем WAV целиком
    const arrayBuffer = await audioBlob.arrayBuffer();
    const header = new Uint8Array(arrayBuffer, 0, 4);
    
    // Проверяем RIFF заголовок
    const isWav = header.reduce(
      (s, c) => s + String.fromCharCode(c), ''
    ) === 'RIFF';
    
    if (!isWav) {
      console.warn('⚠️ Not a WAV file, splitting as-is');
      const CHUNK_SIZE = 900 * 1024; // 900 KB
      const chunks: Blob[] = [];
      for (let offset = 0; offset < arrayBuffer.byteLength; offset += CHUNK_SIZE) {
        chunks.push(
          new Blob([arrayBuffer.slice(offset, offset + CHUNK_SIZE)], { type: 'application/octet-stream' })
        );
      }
      return chunks;
    }
    
    // ✅ Снимаем 44-байтный WAV-заголовок
    const rawPcm = arrayBuffer.slice(44);
    const pcmBytes = new Uint8Array(rawPcm);
    
    // Рассчитываем размер одного чанка (16-бит моно, 16kHz)
    const bytesPerSecond = 16000 * 2; // 16kHz * 2 bytes per sample
    const chunkBytes = chunkDuration * bytesPerSecond;
    
    const chunks: Blob[] = [];
    
    for (let offset = 0; offset < rawPcm.byteLength; offset += chunkBytes) {
      const chunkEnd = Math.min(offset + chunkBytes, rawPcm.byteLength);
      const chunkData = pcmBytes.slice(offset, chunkEnd);
      
      // Каждый чанк оборачиваем в собственный WAV-заголовок
      const chunkWithHeader = this.createWavBlob(chunkData, 16000, 1);
      chunks.push(chunkWithHeader);
    }
    
    console.log(`✅ Audio split into ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Создаёт WAV-blob с корректным заголовком для сырых PCM данных
   */
  private static createWavBlob(pcmData: Uint8Array, sampleRate: number, channels: number): Blob {
    const bytesPerSample = 2; // 16-bit
    const dataSize = pcmData.byteLength;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);
    
    // Запись WAV заголовка
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format chunk size
    view.setUint16(20, 1, true); // Audio format (1 = PCM)
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bytesPerSample, true); // Byte rate
    view.setUint16(32, channels * bytesPerSample, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Копируем PCM данные
    const pcmView = new Uint8Array(arrayBuffer, 44);
    pcmView.set(pcmData);
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }static audioBufferToWav(buffer: AudioBuffer): Blob {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    
    // Calculate buffer size with proper alignment
    const bytesPerSample = 2; // 16-bit
    const dataSize = length * numberOfChannels * bytesPerSample;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);
    
    // Helper function to write strings
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // Enhanced WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format chunk size
    view.setUint16(20, 1, true); // Audio format (1 = PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true); // Byte rate
    view.setUint16(32, numberOfChannels * bytesPerSample, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Convert audio data with enhanced quality
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        let sample = buffer.getChannelData(channel)[i];
        
        // Apply soft clipping to prevent distortion
        sample = Math.max(-1, Math.min(1, sample));
        
        // Convert to 16-bit integer with dithering
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        const ditheredSample = Math.round(intSample + (Math.random() - 0.5));
        
        view.setInt16(offset, ditheredSample, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Enhanced audio characteristics analysis with better speech detection
   */
  static analyzeAudioCharacteristics(audioBuffer: AudioBuffer) {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const length = channelData.length;
    
    // Enhanced RMS calculation with windowing
    let rms = 0;
    const windowSize = Math.floor(sampleRate * 0.025); // 25ms windows
    const numWindows = Math.floor(length / windowSize);
    
    for (let w = 0; w < numWindows; w++) {
      let windowRms = 0;
      const start = w * windowSize;
      const end = Math.min(start + windowSize, length);
      
      for (let i = start; i < end; i++) {
        windowRms += channelData[i] * channelData[i];
      }
      
      windowRms = Math.sqrt(windowRms / (end - start));
      rms += windowRms;
    }
    
    rms = rms / numWindows;
    
    // Enhanced zero crossing rate calculation
    let zeroCrossings = 0;
    for (let i = 1; i < length; i++) {
      if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / length;
    
    // Advanced speech activity detection
    const frameSize = Math.floor(sampleRate * 0.025); // 25ms frames
    const hopSize = Math.floor(frameSize / 2); // 50% overlap
    const frames = Math.floor((length - frameSize) / hopSize) + 1;
    
    let speechFrames = 0;
    let totalEnergy = 0;
    let spectralCentroid = 0;
    
    for (let i = 0; i < frames; i++) {
      const start = i * hopSize;
      const end = Math.min(start + frameSize, length);
      
      // Calculate frame energy
      let frameEnergy = 0;
      for (let j = start; j < end; j++) {
        frameEnergy += channelData[j] * channelData[j];
      }
      frameEnergy = frameEnergy / (end - start);
      totalEnergy += frameEnergy;
      
      // Calculate spectral centroid (simplified)
      let weightedSum = 0;
      let magnitudeSum = 0;
      for (let j = start; j < end; j++) {
        const magnitude = Math.abs(channelData[j]);
        weightedSum += magnitude * (j - start);
        magnitudeSum += magnitude;
      }
      const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
      spectralCentroid += centroid;
      
      // Enhanced speech detection using multiple features
      const energyThreshold = rms * 0.15;
      const zcr = this.calculateFrameZCR(channelData, start, end);
      const zcrThreshold = 0.35;
      const centroidThreshold = frameSize * 0.3;
      
      // Multi-feature speech detection
      if (frameEnergy > energyThreshold && 
          zcr < zcrThreshold && 
          centroid > centroidThreshold) {
        speechFrames++;
      }
    }
    
    const speechRatio = frames > 0 ? speechFrames / frames : 0;
    const averageEnergy = frames > 0 ? totalEnergy / frames : 0;
    const avgSpectralCentroid = frames > 0 ? spectralCentroid / frames : 0;
    
    // Enhanced quality score calculation
    const energyScore = Math.min(1, averageEnergy * 10);
    const speechScore = speechRatio;
    const spectralScore = Math.min(1, avgSpectralCentroid / (frameSize * 0.5));
    
    const qualityScore = (energyScore * 0.4) + (speechScore * 0.4) + (spectralScore * 0.2);
    
    return {
      duration: length / sampleRate,
      averageVolume: rms,
      zeroCrossingRate,
      speechRatio,
      estimatedSpeechTime: speechRatio * (length / sampleRate),
      averageEnergy,
      spectralCentroid: avgSpectralCentroid,
      qualityScore,
      frameCount: frames,
      speechFrameCount: speechFrames,
      energyScore,
      spectralScore
    };
  }

  /**
   * Calculate zero crossing rate for a frame
   */
  private static calculateFrameZCR(data: Float32Array, start: number, end: number): number {
    let crossings = 0;
    for (let i = start + 1; i < end; i++) {
      if ((data[i] >= 0) !== (data[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / (end - start - 1);
  }

  /**
   * Enhanced audio buffer validation with detailed analysis
   */
  static validateAudioBuffer(audioBuffer: AudioBuffer): {
    isValid: boolean;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    issues: string[];
    recommendations: string[];
    score: number;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    const characteristics = this.analyzeAudioCharacteristics(audioBuffer);
    
    // Enhanced validation checks
    if (characteristics.duration < 5) {
      issues.push('Короткое аудио');
      recommendations.push('Используйте видео длительностью не менее 10 секунд');
    }
    
    if (characteristics.averageVolume < 0.005) {
      issues.push('Очень тихое аудио');
      recommendations.push('Увеличьте громкость записи или проверьте микрофон');
    } else if (characteristics.averageVolume > 0.9) {
      issues.push('Перегруженное аудио');
      recommendations.push('Уменьшите громкость для избежания искажений');
    }
    
    if (characteristics.speechRatio < 0.2) {
      issues.push('Мало речевого контента');
      recommendations.push('Убедитесь в наличии активной речи в видео');
    }
    
    if (characteristics.zeroCrossingRate > 0.5) {
      issues.push('Высокий уровень шума');
      recommendations.push('Улучшите условия записи или используйте шумоподавление');
    }
    
    // Enhanced quality determination
    const qualityScore = characteristics.qualityScore;
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    
    if (qualityScore > 0.8) quality = 'excellent';
    else if (qualityScore > 0.6) quality = 'good';
    else if (qualityScore > 0.4) quality = 'fair';
    else quality = 'poor';
    
    // Calculate overall score (0-100)
    const score = Math.round(qualityScore * 100);
    
    return {
      isValid: issues.length === 0 && qualityScore > 0.3,
      quality,
      issues,
      recommendations,
      score
    };
  }
}