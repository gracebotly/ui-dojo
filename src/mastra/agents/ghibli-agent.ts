import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { ghibliFilms, ghibliCharacters } from "../tools/ghibli";

const memory = new Memory();

export const ghibliAgent = new Agent({
  name: "Ghibli Trivia Agent",
  description: "Ghibli Films Agent, use for querying Ghibli Films",
  instructions: "You are my Ghibli Films assistant. I will ask you questions you must retrieve from Ghibli Films.",
  model: "openai/gpt-4o-mini",
  tools: { ghibliFilms, ghibliCharacters },
  memory,
});
