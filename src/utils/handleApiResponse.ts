// src/api/handleApiResponse.ts
export async function handleApiResponse<T>(
    res: Response,
    defaultValue?: T 
  ): Promise<T> {
    if (!res.ok) {
      const errText = await res.text();
      let errorMessage = `API error: ${res.status}`;
      try {
        const errJson = JSON.parse(errText);
        errorMessage = errJson.message || errText;
      } catch (e) {
         // Could not parse JSON, use raw text
         errorMessage = errText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    if (res.status === 204) { // No Content
        return defaultValue as T;
    }
    const json = await res.json();
    return json.data ?? defaultValue;
  }
  
