import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import { DashboardLayout } from '../components/DashboardLayout';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { api, ApiMessage, ApiUser } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type MessageFolder = 'inbox' | 'sent' | 'drafts' | 'deleted';

function isMessageFolder(value: string | null): value is MessageFolder {
	return value === 'inbox' || value === 'sent' || value === 'drafts' || value === 'deleted';
}

export default function MessagesPage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	const [messageFolder, setMessageFolder] = useState<MessageFolder>(() => {
		const raw = searchParams.get('folder');
		return isMessageFolder(raw) ? raw : 'inbox';
	});
	const [messagesLoading, setMessagesLoading] = useState(false);
	const [messagesError, setMessagesError] = useState('');
	const [messages, setMessages] = useState<ApiMessage[]>([]);
	const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
	const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(() => new Set());
	const [messagesRefreshKey, setMessagesRefreshKey] = useState(0);

	const [chatUser, setChatUser] = useState<ApiUser | null>(null);
	const [threadLoading, setThreadLoading] = useState(false);
	const [threadError, setThreadError] = useState('');
	const [threadMessages, setThreadMessages] = useState<ApiMessage[]>([]);
	const threadLastIsoRef = useRef<string | null>(null);
	const [chatBody, setChatBody] = useState('');
	const [chatSending, setChatSending] = useState(false);

	const [contactQuery, setContactQuery] = useState('');
	const [contactLoading, setContactLoading] = useState(false);
	const [contactResults, setContactResults] = useState<ApiUser[]>([]);

	const selectedMessage = useMemo(() => {
		return selectedMessageId ? messages.find((m) => m.id === selectedMessageId) || null : null;
	}, [messages, selectedMessageId]);

	const currentUserId = user?.id ? String(user.id) : null;
	const threadScrollRef = useRef<HTMLDivElement | null>(null);

	const setParam = (key: string, value: string | null) => {
		const next = new URLSearchParams(searchParams);
		if (value === null) next.delete(key);
		else next.set(key, value);
		setSearchParams(next, { replace: true });
	};

	useEffect(() => {
		const raw = searchParams.get('folder');
		setMessageFolder(isMessageFolder(raw) ? raw : 'inbox');
	}, [searchParams]);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			setMessagesError('');
			setMessagesLoading(true);
			try {
				const res = await api.messages({ folder: messageFolder, limit: 50 });
				if (cancelled) return;
				setMessages(res.data);
			} catch (e: any) {
				if (!cancelled) setMessagesError(e?.message || 'Failed to load messages.');
			} finally {
				if (!cancelled) setMessagesLoading(false);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [messageFolder, messagesRefreshKey]);

	useEffect(() => {
		setSelectedMessageIds(new Set());
		setSelectedMessageId(null);
	}, [messageFolder]);

	const toggleSelectedMessage = (id: string, checked: boolean) => {
		setSelectedMessageIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});
	};

	const handleBulkDeleteSelected = async () => {
		if (messageFolder === 'deleted') return;
		const ids = Array.from(selectedMessageIds);
		if (!ids.length) return;
		try {
			await Promise.allSettled(ids.map((id) => api.messageTrash(id)));
		} finally {
			setSelectedMessageIds(new Set());
			setSelectedMessageId(null);
			setMessagesRefreshKey((k) => k + 1);
		}
	};

	useEffect(() => {
		let cancelled = false;
		if (!contactQuery || contactQuery.trim().length < 2) {
			setContactResults([]);
			setContactLoading(false);
			return;
		}

		setContactLoading(true);
		const handle = window.setTimeout(async () => {
			try {
				const res = await api.chatUsers({ q: contactQuery.trim(), limit: 10 });
				if (cancelled) return;
				setContactResults(res.data);
			} catch {
				if (!cancelled) setContactResults([]);
			} finally {
				if (!cancelled) setContactLoading(false);
			}
		}, 250);

		return () => {
			cancelled = true;
			window.clearTimeout(handle);
		};
	}, [contactQuery]);

	const mergeUniqueMessages = (prev: ApiMessage[], incoming: ApiMessage[]) => {
		if (!incoming.length) return prev;
		const seen = new Set(prev.map((m) => m.id));
		const merged = [...prev];
		for (const m of incoming) {
			if (!seen.has(m.id)) {
				seen.add(m.id);
				merged.push(m);
			}
		}
		merged.sort((a, b) => {
			const ai = a.sentAt || a.createdAt || '';
			const bi = b.sentAt || b.createdAt || '';
			if (ai === bi) return Number(a.id) - Number(b.id);
			return ai.localeCompare(bi);
		});
		return merged;
	};

	const loadThread = async (targetUserId: string, mode: 'replace' | 'append') => {
		setThreadError('');
		if (mode === 'replace') {
			setThreadLoading(true);
		}
		try {
			const after = mode === 'append' ? threadLastIsoRef.current : undefined;
			const res = await api.messageThread(targetUserId, { after: after || undefined, limit: 200 });
			setThreadMessages((prev) => (mode === 'replace' ? res.data : mergeUniqueMessages(prev, res.data)));

			const last = res.data.length ? res.data[res.data.length - 1] : null;
			const lastIso = last ? last.sentAt || last.createdAt || null : null;
			if (lastIso) threadLastIsoRef.current = lastIso;

			// Mark any newly received messages as read.
			for (const m of res.data) {
				if (m.status !== 'sent') continue;
				if (!m.recipient?.id || !currentUserId) continue;
				if (String(m.recipient.id) !== String(currentUserId)) continue;
				if (m.readAt) continue;
				api
					.messageRead(m.id)
					.then((readRes) => {
						setThreadMessages((prev) => prev.map((x) => (x.id === m.id ? readRes.data : x)));
						setMessages((prev) => prev.map((x) => (x.id === m.id ? readRes.data : x)));
					})
					.catch(() => undefined);
			}
		} catch (e: any) {
			setThreadError(e?.message || 'Failed to load chat.');
		} finally {
			setThreadLoading(false);
		}
	};

	useEffect(() => {
		if (!chatUser?.id) {
			setThreadMessages([]);
			threadLastIsoRef.current = null;
			return;
		}

		let cancelled = false;
		threadLastIsoRef.current = null;
		setThreadMessages([]);
		loadThread(chatUser.id, 'replace');

		const interval = window.setInterval(() => {
			if (cancelled) return;
			loadThread(chatUser.id, 'append');
		}, 3000);

		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, [chatUser?.id]);

	useEffect(() => {
		const el = threadScrollRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [threadMessages.length, threadLoading]);

	const handleSelectMessage = async (m: ApiMessage) => {
		setSelectedMessageId(m.id);
		if (currentUserId) {
			const other =
				String(m.sender?.id || '') === String(currentUserId) ? (m.recipient as any) : (m.sender as any);
			if (other?.id) {
				setChatUser({
					id: String(other.id),
					name: other.name,
					email: other.email,
					role: other.role,
				} as ApiUser);
			}
		}
		if (messageFolder === 'inbox' && !m.readAt && m.status === 'sent') {
			try {
				const res = await api.messageRead(m.id);
				setMessages((prev) => prev.map((x) => (x.id === m.id ? res.data : x)));
			} catch {
				// ignore
			}
		}
	};

	const handleBackToDashboard = () => {
		if (user?.role === 'admin') navigate('/admin');
		else if (user?.role === 'teacher') navigate('/teacher');
		else navigate('/student');
	};

	const handleStartChat = (u: ApiUser) => {
		setChatUser(u);
		setSelectedMessageId(null);
		setContactQuery('');
		setContactResults([]);
	};

	const handleSendChat = async () => {
		if (!chatUser?.id) return;
		const trimmed = chatBody.trim();
		if (!trimmed) return;
		setChatSending(true);
		try {
			const res = await api.messageCreate({ toUserId: chatUser.id, body: trimmed, status: 'sent', subject: null });
			setThreadMessages((prev) => mergeUniqueMessages(prev, [res.data]));
			setChatBody('');
			const iso = res.data.sentAt || res.data.createdAt || null;
			if (iso) threadLastIsoRef.current = iso;
			setMessages((prev) => {
				// Keep mailbox list fresh; prepend if it belongs in current folder.
				const exists = prev.some((m) => m.id === res.data.id);
				if (exists) return prev;
				if (messageFolder === 'sent') return [res.data, ...prev];
				return prev;
			});
		} catch (e: any) {
			setThreadError(e?.message || 'Failed to send message.');
		} finally {
			setChatSending(false);
		}
	};

	return (
		<DashboardLayout title="Messages">
			<div className="space-y-6">
				<div className="flex items-start justify-between gap-4 flex-wrap">
					<div>
						<h3 className="text-lg font-semibold">Messages</h3>
						<p className="text-sm text-gray-600">Inbox, sent, drafts, and deleted messages</p>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={handleBackToDashboard} aria-label="Back to dashboard">
							<ArrowLeft className="w-4 h-4" />
						</Button>
						{user?.role === 'admin' ? (
							<Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/admin?tab=messages&compose=1')}>
								Compose Mail
							</Button>
						) : null}
					</div>
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					<Button
						variant={messageFolder === 'inbox' ? 'default' : 'outline'}
						onClick={() => {
							setMessageFolder('inbox');
							setParam('folder', 'inbox');
							setSelectedMessageId(null);
						}}
					>
						Inbox
					</Button>
					<Button
						variant={messageFolder === 'sent' ? 'default' : 'outline'}
						onClick={() => {
							setMessageFolder('sent');
							setParam('folder', 'sent');
							setSelectedMessageId(null);
						}}
					>
						Sent
					</Button>
					<Button
						variant={messageFolder === 'drafts' ? 'default' : 'outline'}
						onClick={() => {
							setMessageFolder('drafts');
							setParam('folder', 'drafts');
							setSelectedMessageId(null);
						}}
					>
						Drafts
					</Button>
					<Button
						variant={messageFolder === 'deleted' ? 'default' : 'outline'}
						onClick={() => {
							setMessageFolder('deleted');
							setParam('folder', 'deleted');
							setSelectedMessageId(null);
						}}
					>
						Deleted
					</Button>
					{messageFolder !== 'deleted' ? (
						<Button
							variant="destructive"
							disabled={selectedMessageIds.size === 0}
							onClick={handleBulkDeleteSelected}
						>
							Delete Selected
						</Button>
					) : null}
				</div>

				{messagesError ? (
					<Alert variant="destructive">
						<AlertDescription>{messagesError}</AlertDescription>
					</Alert>
				) : null}

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card className="glass-card">
						<CardHeader>
							<CardTitle className="capitalize">{messageFolder}</CardTitle>
							<CardDescription>
								{messagesLoading
									? 'Loading…'
									: messages.length
										? `${messages.length} message(s)`
										: 'No messages.'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{messages.length === 0 ? (
								<div className="text-sm text-muted-foreground">No messages found.</div>
							) : (
								<div className="space-y-2 max-h-[520px] overflow-auto">
									{messages.map((m) => {
										const iso = m.sentAt || m.createdAt;
										const when = iso ? new Date(iso).toLocaleString() : '—';
										const title = m.subject?.trim() ? m.subject.trim() : '(No subject)';
										const isUnread = messageFolder === 'inbox' && m.status === 'sent' && !m.readAt;
										const selected = selectedMessageId === m.id;
											const checked = selectedMessageIds.has(m.id);
										const subtitle =
											messageFolder === 'sent'
												? `To: ${m.recipient?.name || '—'}`
												: messageFolder === 'inbox'
													? `From: ${m.sender?.name || '—'}`
													: `From: ${m.sender?.name || '—'} • To: ${m.recipient?.name || '—'}`;

											return (
												<button
													type="button"
													key={m.id}
													onClick={() => handleSelectMessage(m)}
													className={`w-full text-left flex items-start justify-between gap-3 p-3 glass-item ${
														selected ? 'ring-2 ring-blue-600' : ''
													}`}
												>
													<div className="flex items-start gap-3 min-w-0">
														<Checkbox
															checked={checked}
															onCheckedChange={(v) => toggleSelectedMessage(m.id, v === true)}
															onClick={(e) => e.stopPropagation()}
														/>
														<div className="min-w-0">
															<div className="flex items-center gap-2">
																<div className="font-medium truncate">{title}</div>
																{m.status === 'draft' ? <Badge variant="secondary">Draft</Badge> : null}
																{isUnread ? <Badge>Unread</Badge> : null}
															</div>
															<div className="text-xs text-gray-600 truncate">{subtitle}</div>
														</div>
													</div>
													<div className="text-xs text-gray-500 whitespace-nowrap">{when}</div>
												</button>
											);
									})}
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="glass-card">
						<CardHeader>
							<div className="flex items-center justify-between gap-3">
								<CardTitle>{chatUser ? `Chat: ${chatUser.name}` : 'Chat'}</CardTitle>
								{chatUser ? (
									<Button variant="outline" onClick={() => setChatUser(null)}>
										<ArrowLeft className="w-4 h-4" />
									</Button>
								) : null}
							</div>
							<CardDescription>
								{chatUser
									? chatUser.email
									: 'Select a message (or start a new chat) to begin.'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{!chatUser ? (
								<div className="space-y-3">
									<div className="text-sm text-muted-foreground">Start a new chat</div>
									<Input
										value={contactQuery}
										onChange={(e) => setContactQuery(e.target.value)}
										placeholder="Search name or email (type at least 2 characters)"
									/>
									{contactLoading ? <div className="text-xs text-gray-500">Searching…</div> : null}
									{contactResults.length ? (
										<div className="space-y-2">
											{contactResults.map((u) => (
												<button
													type="button"
													key={u.id}
													onClick={() => handleStartChat(u)}
													className="w-full text-left p-3 glass-item"
												>
													<div className="font-medium">{u.name}</div>
													<div className="text-xs text-gray-600">{u.email}</div>
												</button>
											))}
										</div>
									) : null}
								</div>
							) : (
								<div className="space-y-4">
									{threadError ? (
										<Alert variant="destructive">
											<AlertDescription>{threadError}</AlertDescription>
										</Alert>
									) : null}

									<div
										ref={threadScrollRef}
										className="max-h-[420px] overflow-auto space-y-2 p-1"
									>
										{threadLoading && threadMessages.length === 0 ? (
											<div className="text-sm text-muted-foreground">Loading chat…</div>
										) : null}
										{threadMessages.map((m) => {
											const mine = currentUserId && String(m.sender?.id || '') === String(currentUserId);
											const iso = m.sentAt || m.createdAt;
											const when = iso ? new Date(iso).toLocaleTimeString() : '';
											return (
												<div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
													<div className={`max-w-[80%] p-3 glass-item ${mine ? 'text-right' : ''}`}>
														<div className="text-sm whitespace-pre-wrap">{m.body}</div>
														<div className="text-[11px] text-gray-500 mt-1">{when}</div>
													</div>
												</div>
											);
										})}
									</div>

									<div className="space-y-2">
										<Textarea
											value={chatBody}
											onChange={(e) => setChatBody(e.target.value)}
											placeholder="Type a message…"
											rows={3}
										/>
										<div className="flex items-center justify-between gap-2">
											<Button variant="outline" onClick={() => setChatUser(null)}>
												Change user
											</Button>
											<Button
												className="bg-blue-600 hover:bg-blue-700"
												disabled={chatSending || !chatBody.trim()}
												onClick={handleSendChat}
											>
												{chatSending ? 'Sending…' : 'Send'}
											</Button>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</DashboardLayout>
	);
}
