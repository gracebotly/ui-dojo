import { useChat } from '@mastra/ai-sdk';
import { useState } from 'react';

export default function CodingAgentPage() {
  const { messages, input, handleSubmit, handleInputChange } = useChat({
    api: '/api/chat',
    body: { agentId: 'coding-agent' },
  });

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">GLM 4.7 Coding Agent</h1>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded ${
              msg.role === 'user' 
                ? 'bg-blue-100 ml-auto max-w-[80%]' 
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            <div className="font-semibold mb-1">
              {msg.role === 'user' ? 'You' : 'Agent'}
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me anything about code..."
          className="flex-1 p-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}
