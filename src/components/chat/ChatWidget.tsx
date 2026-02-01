"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send } from "lucide-react";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
};

// Quick-start suggestions to reduce empty-state friction.
const SUGGESTED_PROMPTS = [
	"Can I take ibuprofen with acetaminophen?",
	"Any interactions with my current medications?",
	"What should I watch for with this medication?",
];

export function ChatWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [input, setInput] = useState("");
	const [isWaiting, setIsWaiting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			id: "welcome",
			role: "assistant",
			content:
				"Hi! Ask me anything about your medications. I’ll use your profile and FDA data.",
		},
	]);

	// tRPC mutation for server-side LangChain chat.
	const chatMutation = api.chat.send.useMutation();
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const lastUserMessageRef = useRef<ChatMessage | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [typingState, setTypingState] = useState<{
		id: string;
		text: string;
		index: number;
	} | null>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isWaiting]);

	useEffect(() => {
		if (!typingState) return;

		const interval = setInterval(() => {
			setTypingState((prev) => {
				if (!prev) return null;
				const nextIndex = Math.min(prev.index + 2, prev.text.length);
				setMessages((current) =>
					current.map((message) =>
						message.id === prev.id
							? { ...message, content: prev.text.slice(0, nextIndex) }
							: message,
					),
				);
				if (nextIndex >= prev.text.length) {
					return null;
				}
				return { ...prev, index: nextIndex };
			});
		}, 20);

		return () => clearInterval(interval);
	}, [typingState]);

	const resizeTextarea = () => {
		if (!textareaRef.current) return;
		textareaRef.current.style.height = "auto";
		textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
	};

	const handleSend = async () => {
		const trimmed = input.trim();
		if (!trimmed || isWaiting || typingState) return;

		const userMessage: ChatMessage = {
			id: `user-${Date.now()}`,
			role: "user",
			content: trimmed,
		};

		// Keep chat state local-only (no persistence).
		const nextMessages = [...messages, userMessage];
		setMessages(nextMessages);
		lastUserMessageRef.current = userMessage;
		setInput("");
		setIsWaiting(true);
		setError(null);

		try {
			// Send full local history so the server can answer in context.
			const response = await chatMutation.mutateAsync({
				messages: nextMessages.map((message) => ({
					role: message.role,
					content: message.content,
				})),
			});
			const assistantId = `assistant-${Date.now()}`;
			setMessages((prev) => [
				...prev,
				{ id: assistantId, role: "assistant", content: "" },
			]);
			setTypingState({ id: assistantId, text: response.reply, index: 0 });
		} catch (err) {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsWaiting(false);
		}
	};

	const handlePromptClick = (prompt: string) => {
		if (isWaiting || typingState) return;
		setInput(prompt);
		requestAnimationFrame(resizeTextarea);
	};

	const handleRetry = async () => {
		if (!lastUserMessageRef.current || isWaiting || typingState) return;
		setError(null);
		setIsWaiting(true);
		try {
			// Retry uses the existing local conversation history.
			const response = await chatMutation.mutateAsync({
				messages: messages.map((message) => ({
					role: message.role,
					content: message.content,
				})),
			});
			const assistantId = `assistant-${Date.now()}`;
			setMessages((prev) => [
				...prev,
				{ id: assistantId, role: "assistant", content: "" },
			]);
			setTypingState({ id: assistantId, text: response.reply, index: 0 });
		} catch (err) {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsWaiting(false);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			void handleSend();
		}
	};

	return (
		<div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
			<div
				aria-hidden={!isOpen}
				className={cn(
					"origin-bottom-right transform transition-all duration-300 ease-out",
					isOpen
						? "pointer-events-auto opacity-100 translate-y-0 scale-100"
						: "pointer-events-none opacity-0 translate-y-4 scale-95"
				)}
			>
				<div
					className={cn(
						isFullscreen
							? "fixed inset-4 h-auto w-auto min-h-0 min-w-0 max-w-none resize-none"
							: "h-[520px] w-[360px] min-h-[360px] min-w-[320px] max-w-[90vw] resize-both",
						"overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/5 backdrop-blur-sm"
					)}
				>
					<Card className="flex h-full w-full flex-col border bg-card">
						<div className="flex items-center justify-between border-b px-4 py-3">
							<div className="flex items-center gap-2">
								<MessageCircle className="h-4 w-4 text-primary" />
								<span className="font-semibold text-foreground">
									CliniqBot
								</span>
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setIsFullscreen((prev) => !prev)}
									aria-label={
										isFullscreen
											? "Exit fullscreen chat"
											: "Fullscreen chat"
									}
								>
									<span className="text-xs font-semibold">⤢</span>
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setIsOpen(false)}
									aria-label="Close chat"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto px-4 py-3">
							<div className="space-y-3">
								<div className="flex flex-wrap gap-2">
									{SUGGESTED_PROMPTS.map((prompt) => (
										<Button
											key={prompt}
											variant="outline"
											size="sm"
											onClick={() => handlePromptClick(prompt)}
											disabled={isWaiting}
											className="text-xs"
										>
											{prompt}
										</Button>
									))}
								</div>

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
											{message.role === "assistant" ? (
												<div className="space-y-2 whitespace-pre-wrap">
													{message.content
														.split("\n")
														.map((line, index) => (
															<p key={`${message.id}-line-${index}`}>{line}</p>
														))}
												</div>
											) : (
												message.content
											)}
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
							{error && (
								<div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
									<div className="mb-1 font-medium">Message failed</div>
									<div className="mb-2 text-xs">{error}</div>
									<Button
										variant="outline"
										size="sm"
										onClick={handleRetry}
										disabled={isWaiting || !!typingState}
									>
										Retry
									</Button>
								</div>
							)}
							<div className="flex items-end gap-2">
								<textarea
									ref={textareaRef}
									value={input}
									onChange={(event) => {
										setInput(event.target.value);
										resizeTextarea();
									}}
									onKeyDown={handleKeyDown}
									onInput={resizeTextarea}
									placeholder="Ask about a medication..."
									aria-label="Chat message"
									disabled={isWaiting || !!typingState}
									rows={1}
									className="min-h-[40px] max-h-32 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								/>
								<Button
									onClick={handleSend}
									disabled={!input.trim() || isWaiting || !!typingState}
									size="icon"
									aria-label="Send message"
								>
									<Send className="h-4 w-4" />
								</Button>
							</div>
							<p className="mt-2 text-xs text-muted-foreground">
								For informational purposes only. Not a substitute for professional
								medical advice.
							</p>
						</div>
					</Card>
				</div>
			</div>

			<Button
				onClick={() => setIsOpen((prev) => !prev)}
				className={cn(
					"relative h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 ease-out",
					isOpen
						? "translate-y-1 scale-95 shadow-md"
						: "hover:scale-105 hover:shadow-xl active:scale-95"
				)}
				aria-label="Open chat"
			>
				<MessageCircle className="h-5 w-5" />
			</Button>
		</div>
	);
}
