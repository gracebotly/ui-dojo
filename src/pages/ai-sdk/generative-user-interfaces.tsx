import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { MASTRA_BASE_URL } from "@/constants";
import {
  Droplets,
  Wind,
  Thermometer,
  MapPin,
  Gauge,
  Sun,
  CloudSun,
  Cloudy,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudLightning,
  CloudHail,
  Cloud,
  type LucideIcon,
} from "lucide-react";
import type { WeatherIconName } from "@/mastra/shared";
import { Loader } from "@/components/ai-elements/loader";

type WeatherProps = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  conditions: string;
  location: string;
  icon: WeatherIconName;
};

const ICON_MAP: Record<WeatherIconName, LucideIcon> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloudy: Cloudy,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-rain-wind": CloudRainWind,
  "cloud-snow": CloudSnow,
  snowflake: Snowflake,
  "cloud-lightning": CloudLightning,
  "cloud-hail": CloudHail,
  cloud: Cloud,
};

const Weather = ({
  temperature,
  feelsLike,
  humidity,
  windSpeed,
  windGust,
  conditions,
  location,
  icon,
}: WeatherProps) => {
  const IconComponent = ICON_MAP[icon];
  return (
    <div className="max-w-md mx-auto bg-linear-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl p-4 text-white">
      <div className="flex flex-row justify-between items-start">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <IconComponent className="w-14 h-14" />
            <div>
              <div className="text-2xl font-bold">{temperature}°C</div>
              <div className="text-lg opacity-90">{conditions}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5" />
          <h2 className="text-xl font-bold">{location}</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
        <div className="flex items-center gap-3">
          <Thermometer className="w-5 h-5 opacity-80" />
          <div>
            <div className="text-sm opacity-80">Feels Like</div>
            <div className="text-lg font-semibold">{feelsLike}°C</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Droplets className="w-5 h-5 opacity-80" />
          <div>
            <div className="text-sm opacity-80">Humidity</div>
            <div className="text-lg font-semibold">{humidity}%</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Wind className="w-5 h-5 opacity-80" />
          <div>
            <div className="text-sm opacity-80">Wind Speed</div>
            <div className="text-lg font-semibold">{windSpeed} km/h</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Gauge className="w-5 h-5 opacity-80" />
          <div>
            <div className="text-sm opacity-80">Wind Gust</div>
            <div className="text-lg font-semibold">{windGust} km/h</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GenerativeUserInterfacesDemo = () => {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${MASTRA_BASE_URL}/chat/weatherAgent`,
    }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-row gap-4 items-center"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a city name"
          />
          <Button type="submit" disabled={status !== "ready"}>
            Get Weather
          </Button>
        </form>
      </div>
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            <div>
              {message.parts.map((part, index) => {
                if (part.type === "text" && message.role === "user") {
                  return (
                    <Message key={index} from={message.role}>
                      <MessageContent>
                        <Response>{part.text}</Response>
                      </MessageContent>
                    </Message>
                  );
                }

                if (part.type === "tool-weatherTool") {
                  switch (part.state) {
                    case "input-available":
                      return <Loader key={index} />;
                    case "output-available":
                      return (
                        <div key={index}>
                          <Weather {...(part.output as WeatherProps)} />
                        </div>
                      );
                    case "output-error":
                      return <div key={index}>Error: {part.errorText}</div>;
                    default:
                      return null;
                  }
                }

                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenerativeUserInterfacesDemo;
