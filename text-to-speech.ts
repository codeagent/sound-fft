export class TextToSpeech {
  constructor(private readonly apiKey: string) {}

  async synthesize(text: string): Promise<Uint8Array> {
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;

    let response: Response;
    if (!self.caches || !(response = await self.caches.match(url))) {
      response = await fetch(url, {
        method: 'post',
        body: JSON.stringify({
          input: {
            text,
          },
          voice: {
            languageCode: 'en-us',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1,
          },
        }),
      });

      if (self.caches) {
        const cache = await self.caches.open('audio');
        await cache.put(url, response);
      }
    }

    const json = await response.json();
    return Uint8Array.from(atob(json.audioContent), (c) => c.charCodeAt(0));
  }
}
