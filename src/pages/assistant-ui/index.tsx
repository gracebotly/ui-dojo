import { Link, useNavigate, useParams } from "react-router";
import { v4 as uuid } from "@lukeed/uuid";
import {
  toAssistantUIMessage,
  useChat,
  type MastraUIMessage,
} from "@mastra/react";
import { useEffect, useRef } from "react";
import { Thread } from "@/components/assistant-ui/thread";
import { useAgent } from "@/hooks/use-agent";
import { useMemory } from "@/hooks/use-memory";
import { useThreads } from "@/hooks/use-threads";
import { useAgentMessages } from "@/hooks/use-agent-messages";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
} from "@assistant-ui/react";
import { Button } from "@/components/ui/button";
import { PlusIcon, X } from "lucide-react";
import type { StorageThreadType } from "@mastra/core/memory";
import { ThreadListSkeleton } from "@/components/assistant-ui/thread-list";
import { useDeleteThread } from "@/hooks/use-delete-thread";

const suggestions = [
  {
    title: "What's the latest movie?",
    action: "What's the latest movie?",
  },
  {
    title: "What's the first Ghibli movie?",
    action: "What's the first Ghibli movie?",
  },
  {
    title: "How many Ghibli movies are there?",
    action: "How many Ghibli movies are there?",
  },
  {
    title: "What's the longest Ghibli movie?",
    action: "What's the longest Ghibli movie?",
  },
];

function newThreadLink(agentId: string) {
  return `/assistant-ui/${agentId}/chat/${uuid()}`;
}

const AssistantUIDemo = () => {
  const { agentId, threadId } = useParams();
  const navigate = useNavigate();

  const { data: agent, isLoading: isAgentLoading } = useAgent(agentId!);
  const { data: memory } = useMemory(agentId!);
  const {
    data: threads,
    isLoading: isThreadsLoading,
    refetch: refreshThreads,
  } = useThreads({
    resourceId: agentId!,
    agentId: agentId!,
    isMemoryEnabled: !!memory?.result,
  });
  const { mutateAsync } = useDeleteThread();

  useEffect(() => {
    if (memory?.result && (!threadId || threadId === "new")) {
      navigate(newThreadLink(agentId!));
    }
  }, [memory?.result, threadId, agentId, navigate]);

  const handleDelete = async (deleteId: string) => {
    await mutateAsync({ threadId: deleteId!, agentId: agentId! });
    if (deleteId === threadId) {
      navigate(newThreadLink(agentId!));
    }
  };

  if (isAgentLoading) {
    return null;
  }

  return (
    <div className="grid grid-cols-[200px_1fr] gap-x-2 px-4 py-4 size-full">
      <Sidebar
        threads={threads || []}
        resourceId={agentId!}
        isLoading={isThreadsLoading}
        threadId={threadId!}
        agentId={agentId!}
        onDelete={handleDelete}
      />
      <Chat
        agentId={agentId!}
        agentName={agent?.name}
        threadId={threadId}
        memory={memory?.result}
        refreshThreadList={refreshThreads}
      />
    </div>
  );
};

export default AssistantUIDemo;

interface ChatProps {
  agentId: string;
  agentName?: string;
  threadId?: string;
  initialMessages?: MastraUIMessage[];
  memory?: boolean;
  refreshThreadList?: () => void;
}

const Chat = ({
  agentId,
  threadId,
  memory,
  agentName,
  refreshThreadList,
}: Omit<ChatProps, "initialMessages">) => {
  const { data: messages, isLoading: isMessagesLoading } = useAgentMessages({
    agentId: agentId,
    threadId: threadId ?? "",
    memory: memory ?? false,
  });

  if (isMessagesLoading) {
    return null;
  }

  return (
    <CustomRuntimeProvider
      initialMessages={(messages?.uiMessages || []) as MastraUIMessage[]}
      agentId={agentId}
      threadId={threadId}
      refreshThreadList={refreshThreadList}
    >
      <Thread
        suggestions={suggestions}
        agentName={agentName}
        welcome="Ask me about Ghibli movies, characters, and trivia."
      />
    </CustomRuntimeProvider>
  );
};

const CustomRuntimeProvider = ({
  children,
  agentId,
  initialMessages,
  threadId,
  refreshThreadList,
}: { children: React.ReactNode } & Omit<ChatProps, "memory" | "agentName">) => {
  const {
    messages,
    sendMessage,
    cancelRun,
    isRunning: isRunningStream,
    setMessages,
  } = useChat({
    agentId,
    initializeMessages: () => initialMessages || [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const onNew = async (message: AppendMessage) => {
    if (message.content[0]?.type !== "text")
      throw new Error("Only text messages are supported");

    const input = message.content[0].text;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await sendMessage({
        message: input,
        mode: "stream",
        threadId,
        onChunk: async (chunk) => {
          if (chunk.type === "finish") {
            await refreshThreadList?.();
          }
        },
        signal: controller.signal,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error occurred in CustomRuntimeProvider", error);

      if (error.name === "AbortError") {
        return;
      }

      setMessages((currentConversation) => [
        ...currentConversation,
        {
          role: "assistant",
          parts: [{ type: "text", text: `${error}` }],
        } as MastraUIMessage,
      ]);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const onCancel = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      cancelRun?.();
    }
  };

  const messagesForRuntime = messages.map(toAssistantUIMessage);

  const runtime = useExternalStoreRuntime({
    isRunning: isRunningStream,
    messages: messagesForRuntime,
    convertMessage: (x) => x,
    onNew,
    onCancel,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};

interface SidebarProps {
  threads: StorageThreadType[];
  agentId: string;
  isLoading: boolean;
  threadId: string;
  resourceId: string;
  onDelete: (threadId: string) => void;
}

const Sidebar = ({
  agentId,
  threadId,
  threads,
  isLoading,
  onDelete,
}: SidebarProps) => {
  if (isLoading) {
    return <ThreadListSkeleton />;
  }

  return (
    <ol className="aui-root aui-thread-list-root flex flex-col items-stretch gap-1.5">
      <li>
        <Button
          className="aui-thread-list-new flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start hover:bg-muted data-active:bg-muted"
          variant="outline"
          asChild
        >
          <Link to={newThreadLink(agentId)}>
            <PlusIcon />
            New Thread
          </Link>
        </Button>
      </li>

      {threads.map((thread) => {
        const isActive = thread.id === threadId;

        const threadLink = `/assistant-ui/${agentId}/chat/${thread.id}`;

        return (
          <li key={thread.id}>
            <Button
              className="aui-thread-list-new flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start hover:bg-muted data-active:bg-muted"
              variant="ghost"
              asChild
              data-active={isActive ? true : undefined}
            >
              <div>
                <Link className="max-w-32 truncate" to={threadLink}>
                  {thread.title}
                </Link>
                <Button
                  onClick={() => onDelete(thread.id)}
                  variant="outline"
                  size="icon-sm"
                >
                  <X aria-label="Delete Thread" />
                </Button>
              </div>
            </Button>
          </li>
        );
      })}
    </ol>
  );
};
