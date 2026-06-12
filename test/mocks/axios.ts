// Мок axios для тестов Yandex-функции: возвращает заранее заданный «сырой» ответ STT API.
let rawResponse: any = { result: { alternatives: [{ text: '', confidence: 0.9 }] } };
export function __setYandexRaw(r: any) { rawResponse = r; }

const axios = {
  async post(_url: string, _data: any, _cfg: any) {
    return { data: rawResponse };
  }
};

export default axios;
