export type WeatherState = {
  locationName: string;
  temperature: number;
  humidity: number | null;
  windSpeed: number | null;
  weatherCode: number;
  description: string;
  updatedAt: string;
  latitude: number;
  longitude: number;
};

export type WeatherLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

export function getWeatherDescription(code: number) {
  if (code === 0) return "Clear sky";
  if (code === 1 || code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Current weather";
}

export function getWeatherIcon(code: number) {
  if (code === 0) return "weather-sunny";
  if (code === 1 || code === 2) return "weather-partly-cloudy";
  if (code === 3) return "weather-cloudy";
  if (code === 45 || code === 48) return "weather-fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "weather-rainy";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "weather-pouring";
  if ([71, 73, 75, 77].includes(code)) return "weather-snowy";
  if ([95, 96, 99].includes(code)) return "weather-lightning-rainy";
  return "weather-partly-cloudy";
}

export async function fetchWeatherForRegion(
  region: string,
): Promise<WeatherState> {
  const geoResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(region)}&count=1&language=en&format=json`,
  );

  if (!geoResponse.ok) {
    throw new Error("Unable to find your region.");
  }

  const geoData = (await geoResponse.json()) as {
    results?: {
      name: string;
      country?: string;
      latitude: number;
      longitude: number;
    }[];
  };

  const location = geoData.results?.[0];

  if (!location) {
    throw new Error(`No weather location found for ${region}.`);
  }

  return fetchWeatherForCoordinates(
    location.latitude,
    location.longitude,
    `${location.name}${location.country ? `, ${location.country}` : ""}`,
  );
}

export async function fetchWeatherForCoordinates(
  latitude: number,
  longitude: number,
  label: string,
): Promise<WeatherState> {
  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`,
  );

  if (!weatherResponse.ok) {
    throw new Error("Unable to load live weather right now.");
  }

  const weatherData = (await weatherResponse.json()) as {
    current?: {
      temperature_2m: number;
      relative_humidity_2m?: number;
      wind_speed_10m?: number;
      weather_code: number;
      time: string;
    };
  };

  if (!weatherData.current) {
    throw new Error("Weather data is not available right now.");
  }

  return {
    locationName: label,
    temperature: weatherData.current.temperature_2m,
    humidity:
      typeof weatherData.current.relative_humidity_2m === "number"
        ? weatherData.current.relative_humidity_2m
        : null,
    windSpeed:
      typeof weatherData.current.wind_speed_10m === "number"
        ? weatherData.current.wind_speed_10m
        : null,
    weatherCode: weatherData.current.weather_code,
    description: getWeatherDescription(weatherData.current.weather_code),
    updatedAt: weatherData.current.time,
    latitude,
    longitude,
  };
}
