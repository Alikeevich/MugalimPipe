import { 
  FilesetResolver, 
  PoseLandmarker, 
  GestureRecognizer,
  FaceLandmarker,
  DrawingUtils
} from '@mediapipe/tasks-vision';

export interface DetailedAnalysisResult {
  poseData: PoseFrameData[];
  gestureData: GestureFrameData[];
  faceData: FaceFrameData[];
  videoDuration: number;
  frameCount: number;
  analysisQuality: {
    poseDetectionRate: number;
    gestureDetectionRate: number;
    faceDetectionRate: number;
    overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  processingStats: {
    totalFramesProcessed: number;
    averageProcessingTime: number;
    errorCount: number;
    skippedFrames: number;
  };
}

export interface PoseFrameData {
  timestamp: number;
  landmarks: any[];
  worldLandmarks: any[];
  confidence: number;
  visibility: number;
  presence: number;
  segmentationMask?: ImageData;
}

export interface GestureFrameData {
  timestamp: number;
  gestures: any[];
  handedness: any[];
  landmarks: any[];
  worldLandmarks: any[];
  confidence: number;
  handCount: number;
}

export interface FaceFrameData {
  timestamp: number;
  landmarks: any[];
  blendshapes: any;
  facialTransformationMatrixes: any[];
  confidence: number;
  boundingBox: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  } | null;
}

export interface MediaPipeInitializationStatus {
  pose: boolean;
  gesture: boolean;
  face: boolean;
  overall: boolean;
  errors: string[];
  wasmPath: string;
  modelPaths: {
    pose: string;
    gesture: string;
    face: string;
  };
}

class MediaPipeService {
  private poseLandmarker: PoseLandmarker | null = null;
  private gestureRecognizer: GestureRecognizer | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private vision: any = null;
  private isInitialized = false;
  private initializationStatus: MediaPipeInitializationStatus;
  private drawingUtils: DrawingUtils | null = null;

  // Enhanced configuration constants with fallbacks
  private readonly WASM_PATHS = [
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm",
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    "/node_modules/@mediapipe/tasks-vision/wasm"
  ];

  private readonly MODEL_PATHS = {
    pose: [
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
    ],
    gesture: [
      "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
    ],
    face: [
      "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
    ]
  };

  constructor() {
    this.initializationStatus = {
      pose: false,
      gesture: false,
      face: false,
      overall: false,
      errors: [],
      wasmPath: '',
      modelPaths: {
        pose: '',
        gesture: '',
        face: ''
      }
    };

    // Suppress MediaPipe console warnings
    this.suppressMediaPipeWarnings();
  }

  /**
   * Suppress MediaPipe console warnings and info messages
   */
  private suppressMediaPipeWarnings(): void {
    // Store original console methods
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalError = console.error;

    // Filter MediaPipe warnings
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (
        message.includes('landmark_projection_calculator') ||
        message.includes('NORM_RECT without IMAGE_DIMENSIONS') ||
        message.includes('inference_feedback_manager') ||
        message.includes('single signature inference') ||
        message.includes('feedback tensors')
      ) {
        return; // Suppress these warnings
      }
      originalWarn.apply(console, args);
    };

    console.info = (...args: any[]) => {
      const message = args.join(' ');
      if (
        message.includes('TensorFlow Lite XNNPACK delegate') ||
        message.includes('Created TensorFlow Lite')
      ) {
        return; // Suppress these info messages
      }
      originalInfo.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (
        message.includes('vision_wasm_internal') ||
        message.includes('put_char') ||
        message.includes('doWritev')
      ) {
        return; // Suppress these internal errors
      }
      originalError.apply(console, args);
    };
  }

  async initialize(): Promise<MediaPipeInitializationStatus> {
    if (this.isInitialized) {
      return this.initializationStatus;
    }

    console.log('🚀 Starting enhanced MediaPipe initialization...');
    this.initializationStatus.errors = [];

    try {
      // Step 1: Initialize Vision FilesetResolver with enhanced error handling
      await this.initializeVisionResolver();

      // Step 2: Initialize components with optimized configurations
      await Promise.allSettled([
        this.initializePoseLandmarker(),
        this.initializeGestureRecognizer(),
        this.initializeFaceLandmarker()
      ]);

      // Step 3: Initialize drawing utils if any component succeeded
      if (this.poseLandmarker || this.gestureRecognizer || this.faceLandmarker) {
        try {
          this.drawingUtils = new DrawingUtils();
          console.log('✅ Drawing utilities initialized');
        } catch (error) {
          console.warn('⚠️ Drawing utilities initialization failed:', error);
        }
      }

      // Step 4: Determine overall initialization status
      this.initializationStatus.overall = 
        this.initializationStatus.pose || 
        this.initializationStatus.gesture || 
        this.initializationStatus.face;

      this.isInitialized = this.initializationStatus.overall;

      if (this.isInitialized) {
        console.log('✅ Enhanced MediaPipe initialization completed successfully');
        console.log('📊 Initialization status:', {
          pose: this.initializationStatus.pose,
          gesture: this.initializationStatus.gesture,
          face: this.initializationStatus.face
        });
      } else {
        console.error('❌ MediaPipe initialization failed completely');
        throw new Error('All MediaPipe components failed to initialize');
      }

      return this.initializationStatus;

    } catch (error) {
      console.error('💥 Critical MediaPipe initialization error:', error);
      this.initializationStatus.errors.push(`Critical error: ${error}`);
      throw error;
    }
  }

  private async initializeVisionResolver(): Promise<void> {
    let lastError: any = null;

    for (const wasmPath of this.WASM_PATHS) {
      try {
        console.log(`🔄 Trying WASM path: ${wasmPath}`);
        
        this.vision = await FilesetResolver.forVisionTasks(wasmPath);
        this.initializationStatus.wasmPath = wasmPath;
        
        console.log(`✅ Vision resolver initialized with path: ${wasmPath}`);
        return;

      } catch (error) {
        console.warn(`⚠️ Failed to load WASM from ${wasmPath}:`, error);
        lastError = error;
        continue;
      }
    }

    throw new Error(`Failed to initialize Vision resolver. Last error: ${lastError}`);
  }

  private async initializePoseLandmarker(): Promise<void> {
    if (!this.vision) {
      throw new Error('Vision resolver not initialized');
    }

    for (const modelPath of this.MODEL_PATHS.pose) {
      try {
        console.log(`🔄 Initializing Pose Landmarker with enhanced config...`);

        this.poseLandmarker = await PoseLandmarker.createFromOptions(this.vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1, // Reduced to 1 for better performance and fewer warnings
          minPoseDetectionConfidence: 0.5, // Increased for better quality
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false // Disabled to reduce warnings
        });

        this.initializationStatus.pose = true;
        this.initializationStatus.modelPaths.pose = modelPath;
        console.log('✅ Pose Landmarker initialized with enhanced config');
        return;

      } catch (error) {
        console.warn(`⚠️ Failed to initialize Pose Landmarker with ${modelPath}:`, error);
        this.initializationStatus.errors.push(`Pose: ${error}`);
        continue;
      }
    }

    console.error('❌ All Pose Landmarker initialization attempts failed');
  }

  private async initializeGestureRecognizer(): Promise<void> {
    if (!this.vision) {
      throw new Error('Vision resolver not initialized');
    }

    for (const modelPath of this.MODEL_PATHS.gesture) {
      try {
        console.log(`🔄 Initializing Gesture Recognizer with enhanced config...`);

        this.gestureRecognizer = await GestureRecognizer.createFromOptions(this.vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5, // Increased for better quality
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        this.initializationStatus.gesture = true;
        this.initializationStatus.modelPaths.gesture = modelPath;
        console.log('✅ Gesture Recognizer initialized with enhanced config');
        return;

      } catch (error) {
        console.warn(`⚠️ Failed to initialize Gesture Recognizer with ${modelPath}:`, error);
        this.initializationStatus.errors.push(`Gesture: ${error}`);
        continue;
      }
    }

    console.error('❌ All Gesture Recognizer initialization attempts failed');
  }

  private async initializeFaceLandmarker(): Promise<void> {
    if (!this.vision) {
      throw new Error('Vision resolver not initialized');
    }

    for (const modelPath of this.MODEL_PATHS.face) {
      try {
        console.log(`🔄 Initializing Face Landmarker with enhanced config...`);

        this.faceLandmarker = await FaceLandmarker.createFromOptions(this.vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1, // Reduced to 1 for better performance
          minFaceDetectionConfidence: 0.5, // Increased for better quality
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false // Disabled to reduce complexity
        });

        this.initializationStatus.face = true;
        this.initializationStatus.modelPaths.face = modelPath;
        console.log('✅ Face Landmarker initialized with enhanced config');
        return;

      } catch (error) {
        console.warn(`⚠️ Failed to initialize Face Landmarker with ${modelPath}:`, error);
        this.initializationStatus.errors.push(`Face: ${error}`);
        continue;
      }
    }

    console.error('❌ All Face Landmarker initialization attempts failed');
  }

  async analyzeVideo(
    videoFile: File, 
    onProgress: (progress: number) => void
  ): Promise<DetailedAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('MediaPipe services not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Enhanced video properties for better compatibility
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.playsInline = true; // Better mobile support
      
      const analysisData = {
        poseData: [] as PoseFrameData[],
        gestureData: [] as GestureFrameData[],
        faceData: [] as FaceFrameData[],
        frameCount: 0,
        totalFrames: 0,
        videoDuration: 0,
        processingTimes: [] as number[],
        errorCount: 0,
        skippedFrames: 0
      };

      // Enhanced adaptive frame interval
      let frameInterval = 0.2; // Start with 200ms for better performance
      let currentTime = 0;
      let lastProcessedTime = -1;

      video.onloadedmetadata = () => {
        try {
          // Enhanced canvas dimensions with aspect ratio preservation
          const maxWidth = 640; // Reduced for better performance
          const maxHeight = 480;
          
          const aspectRatio = video.videoWidth / video.videoHeight;
          
          if (aspectRatio > maxWidth / maxHeight) {
            canvas.width = maxWidth;
            canvas.height = maxWidth / aspectRatio;
          } else {
            canvas.width = maxHeight * aspectRatio;
            canvas.height = maxHeight;
          }
          
          analysisData.videoDuration = video.duration;
          
          // Enhanced adaptive frame interval based on video duration and performance
          if (video.duration > 300) { // > 5 minutes
            frameInterval = 1.0; // 1 second intervals
          } else if (video.duration > 120) { // > 2 minutes
            frameInterval = 0.5; // 500ms intervals
          } else {
            frameInterval = 0.2; // 200ms intervals
          }
          
          analysisData.totalFrames = Math.floor(video.duration / frameInterval);
          
          console.log(`📹 Enhanced video analysis setup:`, {
            duration: video.duration,
            frameInterval,
            totalFrames: analysisData.totalFrames,
            canvasSize: `${canvas.width}x${canvas.height}`
          });
          
          video.currentTime = 0;
          video.play().catch(error => {
            console.error('Video play failed:', error);
            reject(new Error('Failed to play video'));
          });
          
        } catch (error) {
          console.error('Video metadata processing failed:', error);
          reject(new Error('Failed to process video metadata'));
        }
      };

      video.ontimeupdate = async () => {
        try {
          // Check if we've reached the end
          if (video.currentTime >= video.duration) {
            video.pause();
            
            const result = this.buildAnalysisResult(analysisData);
            console.log('🎉 Enhanced analysis complete:', result.analysisQuality);
            resolve(result);
            return;
          }

          // Enhanced frame processing logic
          if (Math.abs(video.currentTime - currentTime) >= frameInterval && 
              video.currentTime !== lastProcessedTime) {
            
            currentTime = video.currentTime;
            lastProcessedTime = video.currentTime;
            
            try {
              await this.processVideoFrameEnhanced(video, canvas, ctx, analysisData);
              
              // Update progress with smoother calculation
              const progress = (video.currentTime / video.duration) * 100;
              onProgress(Math.min(99, progress));
              
            } catch (frameError) {
              console.warn(`Frame processing error at ${video.currentTime}s:`, frameError);
              analysisData.errorCount++;
            }
          }

          // Move to next frame with enhanced timing
          video.currentTime += frameInterval;
          
        } catch (error) {
          console.error('Time update error:', error);
          analysisData.errorCount++;
        }
      };

      video.onerror = (error) => {
        console.error('Video loading error:', error);
        reject(new Error(`Failed to load video: ${error}`));
      };

      video.onabort = () => {
        console.error('Video loading aborted');
        reject(new Error('Video loading was aborted'));
      };

      // Enhanced timeout protection
      const timeout = setTimeout(() => {
        if (analysisData.frameCount === 0) {
          video.pause();
          reject(new Error('Video analysis timeout - no frames processed within 90 seconds'));
        }
      }, 90000); // 90 seconds timeout

      // Cleanup timeout when video ends
      video.onended = () => {
        clearTimeout(timeout);
      };
    });
  }

  private async processVideoFrameEnhanced(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    analysisData: any
  ): Promise<void> {
    const frameStartTime = performance.now();
    
    try {
      // Enhanced frame drawing with better quality
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const timestamp = performance.now();
      analysisData.frameCount++;
      
      // Enhanced parallel processing with better error handling
      const [poseResult, gestureResult, faceResult] = await Promise.allSettled([
        this.analyzePoseFrameEnhanced(canvas, timestamp),
        this.analyzeGestureFrameEnhanced(canvas, timestamp),
        this.analyzeFaceFrameEnhanced(canvas, timestamp)
      ]);

      // Enhanced pose results processing
      if (poseResult.status === 'fulfilled' && poseResult.value) {
        analysisData.poseData.push({
          timestamp: video.currentTime,
          landmarks: poseResult.value.landmarks,
          worldLandmarks: poseResult.value.worldLandmarks,
          confidence: this.calculatePoseConfidenceEnhanced(poseResult.value),
          visibility: this.calculatePoseVisibilityEnhanced(poseResult.value),
          presence: this.calculatePosePresenceEnhanced(poseResult.value),
          segmentationMask: poseResult.value.segmentationMasks?.[0]
        });
      }

      // Enhanced gesture results processing
      if (gestureResult.status === 'fulfilled' && gestureResult.value) {
        analysisData.gestureData.push({
          timestamp: video.currentTime,
          gestures: gestureResult.value.gestures,
          handedness: gestureResult.value.handedness,
          landmarks: gestureResult.value.landmarks,
          worldLandmarks: gestureResult.value.worldLandmarks,
          confidence: this.calculateGestureConfidenceEnhanced(gestureResult.value),
          handCount: gestureResult.value.landmarks?.length || 0
        });
      }

      // Enhanced face results processing
      if (faceResult.status === 'fulfilled' && faceResult.value) {
        analysisData.faceData.push({
          timestamp: video.currentTime,
          landmarks: faceResult.value.faceLandmarks,
          blendshapes: faceResult.value.faceBlendshapes?.[0],
          facialTransformationMatrixes: faceResult.value.facialTransformationMatrixes,
          confidence: this.calculateFaceConfidenceEnhanced(faceResult.value),
          boundingBox: this.calculateFaceBoundingBoxEnhanced(faceResult.value)
        });
      }

      // Record processing time
      const processingTime = performance.now() - frameStartTime;
      analysisData.processingTimes.push(processingTime);

    } catch (error) {
      console.warn(`Enhanced frame processing failed at ${video.currentTime}s:`, error);
      analysisData.errorCount++;
      analysisData.skippedFrames++;
    }
  }

  private async analyzePoseFrameEnhanced(canvas: HTMLCanvasElement, timestamp: number): Promise<any> {
    if (!this.poseLandmarker) {
      return null;
    }
    
    try {
      const results = this.poseLandmarker.detectForVideo(canvas, timestamp);
      return results.landmarks && results.landmarks.length > 0 ? results : null;
    } catch (error) {
      // Suppress specific MediaPipe warnings
      if (!error.toString().includes('landmark_projection_calculator')) {
        console.warn('Pose detection error:', error);
      }
      return null;
    }
  }

  private async analyzeGestureFrameEnhanced(canvas: HTMLCanvasElement, timestamp: number): Promise<any> {
    if (!this.gestureRecognizer) {
      return null;
    }
    
    try {
      const results = this.gestureRecognizer.recognizeForVideo(canvas, timestamp);
      return (results.gestures && results.gestures.length > 0) || 
             (results.landmarks && results.landmarks.length > 0) ? results : null;
    } catch (error) {
      // Suppress specific MediaPipe warnings
      if (!error.toString().includes('inference_feedback_manager')) {
        console.warn('Gesture recognition error:', error);
      }
      return null;
    }
  }

  private async analyzeFaceFrameEnhanced(canvas: HTMLCanvasElement, timestamp: number): Promise<any> {
    if (!this.faceLandmarker) {
      return null;
    }
    
    try {
      const results = this.faceLandmarker.detectForVideo(canvas, timestamp);
      return results.faceLandmarks && results.faceLandmarks.length > 0 ? results : null;
    } catch (error) {
      // Suppress specific MediaPipe warnings
      if (!error.toString().includes('landmark_projection_calculator')) {
        console.warn('Face detection error:', error);
      }
      return null;
    }
  }

  // Enhanced confidence calculation methods
  private calculatePoseConfidenceEnhanced(results: any): number {
    if (!results.landmarks || results.landmarks.length === 0) return 0;
    
    const pose = results.landmarks[0];
    if (!pose || pose.length === 0) return 0;

    // Enhanced key points for confidence calculation
    const keyPoints = [
      0,   // nose
      11, 12, // shoulders
      13, 14, // elbows
      15, 16, // wrists
      23, 24, // hips
    ];
    
    let totalConfidence = 0;
    let validPoints = 0;
    
    keyPoints.forEach(index => {
      if (pose[index]) {
        const point = pose[index];
        const visibility = point.visibility || 0;
        const presence = point.presence || 0;
        
        // Enhanced confidence calculation
        const pointConfidence = (visibility * 0.6) + (presence * 0.4);
        totalConfidence += pointConfidence;
        validPoints++;
      }
    });
    
    return validPoints > 0 ? totalConfidence / validPoints : 0;
  }

  private calculatePoseVisibilityEnhanced(results: any): number {
    if (!results.landmarks || results.landmarks.length === 0) return 0;
    
    const pose = results.landmarks[0];
    if (!pose || pose.length === 0) return 0;

    let totalVisibility = 0;
    let validPoints = 0;
    
    pose.forEach((point: any) => {
      if (point && typeof point.visibility === 'number') {
        totalVisibility += point.visibility;
        validPoints++;
      }
    });
    
    return validPoints > 0 ? totalVisibility / validPoints : 0;
  }

  private calculatePosePresenceEnhanced(results: any): number {
    if (!results.landmarks || results.landmarks.length === 0) return 0;
    
    const pose = results.landmarks[0];
    if (!pose || pose.length === 0) return 0;

    let totalPresence = 0;
    let validPoints = 0;
    
    pose.forEach((point: any) => {
      if (point && typeof point.presence === 'number') {
        totalPresence += point.presence;
        validPoints++;
      }
    });
    
    return validPoints > 0 ? totalPresence / validPoints : 0;
  }

  private calculateGestureConfidenceEnhanced(results: any): number {
    if (!results.gestures || results.gestures.length === 0) {
      // Enhanced hand detection confidence
      if (results.landmarks && results.landmarks.length > 0) {
        return 0.6; // Higher base confidence for hand detection
      }
      return 0;
    }
    
    let totalConfidence = 0;
    let gestureCount = 0;
    
    results.gestures.forEach((handGestures: any[]) => {
      if (handGestures && handGestures.length > 0) {
        handGestures.forEach((gesture: any) => {
          if (gesture && typeof gesture.score === 'number') {
            totalConfidence += gesture.score;
            gestureCount++;
          }
        });
      }
    });
    
    // Enhanced confidence calculation with hand quality
    if (results.landmarks && results.landmarks.length > 0) {
      const handQuality = Math.min(1, results.landmarks.length / 2); // Normalize by max hands (2)
      const gestureConfidence = gestureCount > 0 ? totalConfidence / gestureCount : 0;
      
      return (gestureConfidence * 0.7) + (handQuality * 0.3);
    }
    
    return gestureCount > 0 ? totalConfidence / gestureCount : 0;
  }

  private calculateFaceConfidenceEnhanced(results: any): number {
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) return 0;
    
    const face = results.faceLandmarks[0];
    if (!face || face.length === 0) return 0;

    // Enhanced confidence based on landmark quality
    let landmarkConfidence = Math.min(1, face.length / 468); // MediaPipe face mesh has 468 points
    
    // Enhanced blendshapes analysis
    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const blendshapes = results.faceBlendshapes[0];
      if (blendshapes && blendshapes.categories) {
        let expressionActivity = 0;
        let validExpressions = 0;
        
        blendshapes.categories.forEach((category: any) => {
          if (category.score > 0.05) { // Lower threshold for better detection
            expressionActivity += category.score;
            validExpressions++;
          }
        });
        
        if (validExpressions > 0) {
          const expressionConfidence = Math.min(1, expressionActivity / validExpressions);
          landmarkConfidence = (landmarkConfidence * 0.6) + (expressionConfidence * 0.4);
        }
      }
    }
    
    return landmarkConfidence;
  }

  private calculateFaceBoundingBoxEnhanced(results: any): any {
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) return null;
    
    const landmarks = results.faceLandmarks[0];
    if (!landmarks || landmarks.length === 0) return null;

    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    
    landmarks.forEach((point: any) => {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    });
    
    return {
      originX: minX,
      originY: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private buildAnalysisResult(analysisData: any): DetailedAnalysisResult {
    const totalFrames = analysisData.frameCount;
    const poseDetectionRate = totalFrames > 0 ? analysisData.poseData.length / totalFrames : 0;
    const gestureDetectionRate = totalFrames > 0 ? analysisData.gestureData.length / totalFrames : 0;
    const faceDetectionRate = totalFrames > 0 ? analysisData.faceData.length / totalFrames : 0;
    
    // Enhanced quality determination
    const avgDetectionRate = (poseDetectionRate + gestureDetectionRate + faceDetectionRate) / 3;
    let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    
    if (avgDetectionRate >= 0.8) overallQuality = 'excellent';
    else if (avgDetectionRate >= 0.6) overallQuality = 'good';
    else if (avgDetectionRate >= 0.4) overallQuality = 'fair';
    else overallQuality = 'poor';

    const avgProcessingTime = analysisData.processingTimes.length > 0 
      ? analysisData.processingTimes.reduce((a: number, b: number) => a + b, 0) / analysisData.processingTimes.length
      : 0;

    return {
      poseData: analysisData.poseData,
      gestureData: analysisData.gestureData,
      faceData: analysisData.faceData,
      videoDuration: analysisData.videoDuration,
      frameCount: analysisData.frameCount,
      analysisQuality: {
        poseDetectionRate,
        gestureDetectionRate,
        faceDetectionRate,
        overallQuality
      },
      processingStats: {
        totalFramesProcessed: totalFrames,
        averageProcessingTime: avgProcessingTime,
        errorCount: analysisData.errorCount,
        skippedFrames: analysisData.skippedFrames
      }
    };
  }

  // Enhanced quality assessment method
  getAnalysisQuality(result: DetailedAnalysisResult): string {
    const { analysisQuality, processingStats } = result;
    const { overallQuality, poseDetectionRate, gestureDetectionRate, faceDetectionRate } = analysisQuality;
    
    const qualityMessages = {
      excellent: `Отличное качество анализа (${Math.round(poseDetectionRate * 100)}% поза, ${Math.round(gestureDetectionRate * 100)}% жесты, ${Math.round(faceDetectionRate * 100)}% лицо)`,
      good: `Хорошее качество анализа (${Math.round(poseDetectionRate * 100)}% поза, ${Math.round(gestureDetectionRate * 100)}% жесты, ${Math.round(faceDetectionRate * 100)}% лицо)`,
      fair: `Удовлетворительное качество анализа (${Math.round(poseDetectionRate * 100)}% поза, ${Math.round(gestureDetectionRate * 100)}% жесты, ${Math.round(faceDetectionRate * 100)}% лицо)`,
      poor: `Базовое качество анализа (${Math.round(poseDetectionRate * 100)}% поза, ${Math.round(gestureDetectionRate * 100)}% жесты, ${Math.round(faceDetectionRate * 100)}% лицо)`
    };
    
    let message = qualityMessages[overallQuality];
    
    if (processingStats.errorCount > 0) {
      message += `. Обработано с ${processingStats.errorCount} предупреждениями`;
    }
    
    return message;
  }

  // Get initialization status
  getInitializationStatus(): MediaPipeInitializationStatus {
    return { ...this.initializationStatus };
  }

  // Check if specific component is available
  isComponentAvailable(component: 'pose' | 'gesture' | 'face'): boolean {
    switch (component) {
      case 'pose': return !!this.poseLandmarker;
      case 'gesture': return !!this.gestureRecognizer;
      case 'face': return !!this.faceLandmarker;
      default: return false;
    }
  }

  // Get available components
  getAvailableComponents(): string[] {
    const components: string[] = [];
    if (this.poseLandmarker) components.push('pose');
    if (this.gestureRecognizer) components.push('gesture');
    if (this.faceLandmarker) components.push('face');
    return components;
  }

  // Enhanced disposal method
  dispose(): void {
    console.log('🧹 Disposing MediaPipe services...');
    
    try {
      if (this.poseLandmarker) {
        this.poseLandmarker.close();
        this.poseLandmarker = null;
        console.log('✅ Pose Landmarker disposed');
      }
    } catch (error) {
      console.warn('⚠️ Error disposing Pose Landmarker:', error);
    }

    try {
      if (this.gestureRecognizer) {
        this.gestureRecognizer.close();
        this.gestureRecognizer = null;
        console.log('✅ Gesture Recognizer disposed');
      }
    } catch (error) {
      console.warn('⚠️ Error disposing Gesture Recognizer:', error);
    }

    try {
      if (this.faceLandmarker) {
        this.faceLandmarker.close();
        this.faceLandmarker = null;
        console.log('✅ Face Landmarker disposed');
      }
    } catch (error) {
      console.warn('⚠️ Error disposing Face Landmarker:', error);
    }

    this.drawingUtils = null;
    this.vision = null;
    this.isInitialized = false;
    
    // Reset initialization status
    this.initializationStatus = {
      pose: false,
      gesture: false,
      face: false,
      overall: false,
      errors: [],
      wasmPath: '',
      modelPaths: {
        pose: '',
        gesture: '',
        face: ''
      }
    };
    
    console.log('🧹 MediaPipe services disposal completed');
  }
}

export const mediaPipeService = new MediaPipeService();