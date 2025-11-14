import { CopilotChat } from "@copilotkit/react-ui";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import { MASTRA_BASE_URL } from "@/constants";

function CopilotKitDemo() {
  return (
    <CopilotKit
      runtimeUrl={`${MASTRA_BASE_URL}/copilotkit`}
      agent="ghibliAgent"
    >
      <CopilotChat
        labels={{
          title: "Ghibli Films Assistant",
          initial: "Hi! 👋 Ask me about Ghibli movies, characters, and trivia.",
        }}
      />
    </CopilotKit>
  );
}

export default CopilotKitDemo;
