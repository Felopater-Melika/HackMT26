"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send } from "lucide-react";

type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
};

const PLACEHOLDER_REPLY =
	"Thanks for your question. I’ll be able to answer with your profile and FDA data soon.";

export function ChatWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState("");
	const [isWaiting, setIsWaiting] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			id: "welcome",
			role: "assistant",
			content:
				"Hi! Ask me anything about your medications. I’ll use your profile and FDA data.",
		},
	]);

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isWaiting]);

	const handleSend = async () => {
		const trimmed = input.trim();
		if (!trimmed || isWaiting) return;

		const userMessage: ChatMessage = {
			id: `user-${Date.now()}`,
			role: "user",
			content: trimmed,
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsWaiting(true);

		setTimeout(() => {
			const assistantMessage: ChatMessage = {
				id: `assistant-${Date.now()}`,
				role: "assistant",
				content: PLACEHOLDER_REPLY,
			};
			setMessages((prev) => [...prev, assistantMessage]);
			setIsWaiting(false);
		}, 900);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			void handleSend();
		}
	};

	return (
		<div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
			{isOpen && (
				<Card className="w-[360px] max-w-[90vw] border bg-card shadow-xl">
					<div className="flex items-center justify-between border-b px-4 py-3">
						<div className="flex items-center gap-2">
							<MessageCircle className="h-4 w-4 text-primary" />
							<span className="font-semibold text-foreground">
								Medication Chat
							</span>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsOpen(false)}
							aria-label="Close chat"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					<div className="max-h-[360px] overflow-y-auto px-4 py-3">
						<div className="space-y-3">
							{messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${
										message.role === "user"
											? "justify-end"
											: "justify-start"
									}`}
								>
									<div
										className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
											message.role === "user"
												? "bg-primary text-primary-foreground"
												: "bg-muted text-foreground"
										}`}
									>
										{message.content}
									</div>
								</div>
							))}

							{isWaiting && (
								<div className="flex justify-start">
									<div className="rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
										<span className="inline-flex items-center gap-1">
											<span className="h-2 w-2 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.3s]" />
											<span className="h-2 w-2 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.15s]" />
											<span className="h-2 w-2 animate-bounce rounded-full bg-foreground/60" />
										</span>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>
					</div>

					<div className="border-t px-4 py-3">
						<div className="flex items-center gap-2">
							<Input
								value={input}
								onChange={(event) => setInput(event.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Ask about a medication..."
								aria-label="Chat message"
								disabled={isWaiting}
							/>
							<Button
								onClick={handleSend}
								disabled={!input.trim() || isWaiting}
								size="icon"
								aria-label="Send message"
							>
								<Send className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</Card>
			)}

			<Button
				onClick={() => setIsOpen((prev) => !prev)}
				className="h-12 w-12 rounded-full shadow-lg"
				aria-label="Open chat"
			>
				<MessageCircle className="h-5 w-5" />
			</Button>
		</div>
	);
}
