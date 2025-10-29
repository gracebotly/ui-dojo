import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import { useState } from "react";

type DisplayStepProps = {
  type: `tool-${string}`;
  title: string
  status: "running" | "success" | "failed" | "suspended" | "waiting";
  text: unknown
}

const STATUS_MAP: Record<DisplayStepProps["status"], ToolUIPart["state"]> = {
  running: "input-available",
  waiting: "input-available",
  suspended: "output-error",
  success: "output-available",
  failed: "output-error",
}

const DisplayStep = ({ type, status, text, title }: DisplayStepProps) => {
  const errorText = `Could not fetch data for ${title}`

  return (
  <Tool>
    <ToolHeader title={title} type={type} state={STATUS_MAP[status]} />
    <ToolContent>
      <ToolOutput output={text} errorText={status === 'failed' ? errorText : undefined} />
    </ToolContent>
  </Tool>
)
}

export const WorkflowDemo = () => {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "http://localhost:4111/workflow/weatherWorkflow",
      prepareSendMessagesRequest: ({ messages }) => {
        return {
          body: {
            inputData: {
              // @ts-expect-error - FIX THIS
              location: messages[messages.length - 1].parts[0].text,
            },
          },
        };
      },
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
            placeholder="Ask about the weather in any city and get activity suggestions"
          />
          <Button type="submit" disabled={status !== "ready"}>
            Get Weather
          </Button>
        </form>
      </div>
      {messages.map((message) => (
          <div key={message.id}>
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

                if (part.type === "data-workflow") {
                  const type = `tool-${part.type}` as const
                  const steps = Object.values(part.data.steps)

                  const lastStep = steps[steps.length - 1]

                  return (
                    <>
                      {steps.map(step => (
                        <DisplayStep
                          key={step.name}
                          type={type}
                          status={step.status}
                          text={step.output}
                          title={step.name}
                        />
                      ))}
                      {status === "ready" && (
                        <Message from="assistant">
                          <MessageContent>
                            <Response>
                              {lastStep.output.activities}
                            </Response>
                          </MessageContent>
                        </Message>
                      )}
                    </>
                  )
                }

                return null;
              })}
          </div>
        ))}
        {status === "submitted" && <Loader />}
    </div>
  );
};
