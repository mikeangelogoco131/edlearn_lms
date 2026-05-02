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
	const isTeacher = user?.role === 'teacher';
	const isStudent = user?.role === 'student';

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
	const [composeOpen, setComposeOpen] = useState(() => searchParams.get('compose') === '1');
	const [composeRecipientQuery, setComposeRecipientQuery] = useState('');
	const [composeRecipientId, setComposeRecipientId] = useState<string | null>(null);
	const [composeRecipientLoading, setComposeRecipientLoading] = useState(false);
	const [composeRecipientResults, setComposeRecipientResults] = useState<ApiUser[]>([]);
	const [composeSubject, setComposeSubject] = useState('');
	const [composeBody, setComposeBody] = useState('');
	const [composeSaving, setComposeSaving] = useState(false);
	const [composeError, setComposeError] = useState('');
	const [composeSuccess, setComposeSuccess] = useState('');

	const selectedMessage = useMemo(() => {
		return selectedMessageId ? messages.find((m) => m.id === selectedMessageId) || null : null;
	}, [messages, selectedMessageId]);

	const currentUserId = user?.id ? String(user.id) : null;
	const threadScrollRef = useRef<HTMLDivElement | null>(null);
	const notifiedMessageIdsRef = useRef<Set<string>>(new Set());

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
		// Allow compose for teachers and students (role-aware)
		if (!isTeacher && !isStudent) {
			setComposeOpen(false);
			return;
		}
		setComposeOpen(searchParams.get('compose') === '1');
	}, [searchParams, isTeacher, isStudent]);

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
		const handleStorage = (event: StorageEvent) => {
			if (event.key !== 'edlearn_dev_messages' && event.key !== 'edlearn_message_mods') return;
			setMessagesRefreshKey((k) => k + 1);
		};

		window.addEventListener('storage', handleStorage);
		return () => window.removeEventListener('storage', handleStorage);
	}, []);

	// Notify about new unread messages in inbox
	useEffect(() => {
		if (messageFolder !== 'inbox') return;
		
		messages.forEach((m) => {
			// Only notify for unread, incoming messages that haven't been notified yet
			if (
				!m.readAt &&
				m.status === 'sent' &&
				m.sender &&
				String(m.sender.id) !== String(currentUserId) &&
				!notifiedMessageIdsRef.current.has(m.id) &&
				'Notification' in window &&
				Notification.permission === 'granted'
			) {
				notifiedMessageIdsRef.current.add(m.id);
				try {
					new Notification('New Message', {
						body: `Message from ${m.sender.name}: ${m.subject || '(No subject)'}`,
						icon: '/favicon.ico',
					});
				} catch (err) {
					// Ignore notification errors
				}
			}
		});
	}, [messages, messageFolder, currentUserId]);

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
			setContactResults((res?.data || []).map((u: any) => ({ ...u, role: u.role as any })));
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

	useEffect(() => {
		let cancelled = false;
		if (!composeOpen || (!isTeacher && !isStudent)) {
			setComposeRecipientResults([]);
			setComposeRecipientLoading(false);
			return;
		}

		setComposeRecipientLoading(true);
		const handle = window.setTimeout(async () => {
			try {
				const query = composeRecipientQuery.trim();
				const role = isTeacher ? 'student' : 'teacher';
				const res = await api.users({
					role,
					q: query.length ? query : undefined,
					page: 1,
					perPage: 15,
				});
				if (cancelled) return;
				setComposeRecipientResults(res.data.filter((u) => u.role === role));
			} catch {
				if (!cancelled) setComposeRecipientResults([]);
			} finally {
				if (!cancelled) setComposeRecipientLoading(false);
			}
		}, 250);

		return () => {
			cancelled = true;
			window.clearTimeout(handle);
		};
	}, [composeOpen, composeRecipientQuery, isTeacher, isStudent]);

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
			if (res) {
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

		// Poll for new messages more frequently for real-time feel (1 second)
		const interval = window.setInterval(() => {
			if (cancelled) return;
			loadThread(chatUser.id, 'append');
		}, 1000);

		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, [chatUser?.id]);

	useEffect(() => {
		const el = threadScrollRef.current;
		if (!el) return;
		// Auto-scroll to bottom smoothly
		setTimeout(() => {
			el.scrollTop = el.scrollHeight;
		}, 0);
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

	const openCompose = () => {
		setComposeError('');
		setComposeSuccess('');
		setComposeOpen(true);
		setParam('compose', '1');
	};

	const closeCompose = () => {
		setComposeOpen(false);
		setParam('compose', null);
		setComposeRecipientQuery('');
		setComposeRecipientId(null);
		setComposeSubject('');
		setComposeBody('');
		setComposeRecipientResults([]);
		setComposeError('');
		setComposeSuccess('');
	};

	const handleSendCompose = async () => {
		setComposeError('');
		setComposeSuccess('');
		if (!composeRecipientId) {
			setComposeError(
				isTeacher ? 'Please select a student recipient.' : 'Please select a teacher recipient.'
			);
			return;
		}
		if (!composeBody.trim()) {
			setComposeError('Message body is required.');
			return;
		}

		setComposeSaving(true);
		try {
			const recipient = composeRecipientResults.find((u) => u.id === composeRecipientId);
			await api.messageCreate({
				toUserId: composeRecipientId,
				subject: composeSubject || null,
				body: composeBody,
				status: 'sent',
			});

			setComposeSuccess(`✓ Message sent to ${recipient?.name || (isTeacher ? 'student' : 'teacher')}`);
			setMessageFolder('sent');
			setParam('folder', 'sent');
			setMessagesRefreshKey((k) => k + 1);
			setTimeout(() => {
				closeCompose();
			}, 1200);
		} catch (e: any) {
			setComposeError(e?.message || 'Failed to send message.');
		} finally {
			setComposeSaving(false);
		}
	};

	const handleSendChat = async () => {
		if (!chatUser?.id) return;
		const trimmed = chatBody.trim();
		if (!trimmed) return;

		// Create optimistic message (show immediately)
		const optimisticMessage: ApiMessage = {
			id: `temp-${Date.now()}`,
			subject: null,
			body: trimmed,
			status: 'sent',
			sentAt: new Date().toISOString(),
			readAt: null,
			createdAt: new Date().toISOString(),
			sender: user
				? { id: String(user.id), name: user.name, email: user.email, role: user.role }
				: { id: 'dev-user', name: 'You', email: 'user@dev.local', role: 'student' },
			recipient: chatUser,
		};

		// Clear input immediately
		setChatBody('');
		setThreadMessages((prev) => mergeUniqueMessages(prev, [optimisticMessage]));

		// Scroll to bottom
		setTimeout(() => {
			const el = threadScrollRef.current;
			if (el) el.scrollTop = el.scrollHeight;
		}, 0);

		setChatSending(true);
		try {
			const res = await api.messageCreate({ toUserId: chatUser.id, body: trimmed, status: 'sent', subject: null });
			// Replace optimistic message with real one
			setThreadMessages((prev) =>
				prev.map((m) => (m.id === optimisticMessage.id ? res.data : m))
			);
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
						{user?.role === 'teacher' ? (
							<Button className="bg-blue-600 hover:bg-blue-700" onClick={openCompose}>
								Compose to Student
							</Button>
						) : user?.role === 'student' ? (
							<Button className="bg-blue-600 hover:bg-blue-700" onClick={openCompose}>
								Compose to Teacher
							</Button>
						) : user?.role === 'admin' ? (
							<Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/admin?tab=messages&compose=1')}>
								Compose Mail
							</Button>
						) : null}
					</div>
				</div>

				{(isTeacher || isStudent) && composeOpen ? (
					<Card className="glass-card">
						<CardHeader>
							<CardTitle>{isTeacher ? 'Compose to Student' : 'Compose to Teacher'}</CardTitle>
							<CardDescription>
								{isTeacher
									? 'Send a message directly to one of your students'
									: 'Send a message directly to one of your teachers'}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{composeError ? <Alert variant="destructive"><AlertDescription>{composeError}</AlertDescription></Alert> : null}
							{composeSuccess ? <Alert><AlertDescription>{composeSuccess}</AlertDescription></Alert> : null}

							<div className="space-y-2">
								<div className="text-sm font-medium">{isTeacher ? 'Send to Student' : 'Send to Teacher'}</div>
								<Input
									value={composeRecipientQuery}
									placeholder={isTeacher ? 'Search student by name or email…' : 'Search teacher by name or email…'}
									onChange={(e) => {
										setComposeRecipientQuery(e.target.value);
										setComposeRecipientId(null);
									}}
									onFocus={() => setComposeRecipientQuery((v) => v)}
								/>
								{composeRecipientLoading ? <div className="text-xs text-muted-foreground mt-2">Loading students…</div> : null}
								{composeRecipientResults.length ? (
									<div className="mt-2 space-y-1 max-h-40 overflow-auto border rounded p-2 bg-slate-50">
										{composeRecipientResults.map((u) => (
											<button
												type="button"
												key={u.id}
												onClick={() => {
													setComposeRecipientId(u.id);
													setComposeRecipientQuery(`${u.name} <${u.email}>`);
												}}
												className="w-full text-left px-3 py-2 rounded hover:bg-blue-100 transition text-sm"
											>
												<div className="font-medium">{u.name}</div>
												<div className="text-xs text-gray-600">{u.email}</div>
											</button>
										))}
									</div>
								) : null}
								{composeRecipientId ? <div className="text-xs text-green-600 mt-1">✓ Recipient selected</div> : null}
							</div>

							<div className="space-y-2">
								<div className="text-sm font-medium">Subject (optional)</div>
								<Input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subject" />
							</div>

							<div className="space-y-2">
								<div className="text-sm font-medium">Message</div>
								<Textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Write your message…" rows={5} />
							</div>

							<div className="flex items-center gap-2">
								<Button className="bg-blue-600 hover:bg-blue-700" disabled={composeSaving} onClick={handleSendCompose}>
									{composeSaving ? 'Sending…' : 'Send'}
								</Button>
								<Button variant="outline" onClick={closeCompose}>Cancel</Button>
							</div>
						</CardContent>
					</Card>
				) : null}

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
										className="max-h-[420px] overflow-auto space-y-3 p-3 bg-gradient-to-b from-transparent via-transparent to-transparent"
									>
										{threadLoading && threadMessages.length === 0 ? (
											<div className="text-sm text-muted-foreground text-center py-4">Loading chat…</div>
										) : threadMessages.length === 0 ? (
											<div className="text-sm text-muted-foreground text-center py-4">No messages yet</div>
										) : null}
										{threadMessages.map((m, idx) => {
											const mine = currentUserId && String(m.sender?.id || '') === String(currentUserId);
											const iso = m.sentAt || m.createdAt;
											const when = iso ? new Date(iso).toLocaleTimeString() : '';
											const isSending = m.id.startsWith('temp-');
											const prevMessage = idx > 0 ? threadMessages[idx - 1] : null;
											const sameSender = prevMessage && String(prevMessage.sender?.id) === String(m.sender?.id);

											return (
												<div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
													<div
														className={`flex flex-col ${mine ? 'items-end' : 'items-start'} gap-1 max-w-[80%]`}
													>
														{!sameSender && (
															<div className="text-[11px] text-gray-500 px-1">
																{m.sender?.name || 'Unknown'}
															</div>
														)}
														<div
															className={`px-4 py-2 rounded-lg break-words ${
																mine
																	? 'bg-blue-600 text-white rounded-br-none'
																	: 'bg-gray-700 text-gray-100 rounded-bl-none'
															} ${isSending ? 'opacity-75 italic' : ''}`}
														>
															<div className="text-sm whitespace-pre-wrap">{m.body}</div>
														</div>
														<div className={`text-[10px] text-gray-500 px-1 ${isSending ? 'italic' : ''}`}>
															{isSending ? 'Sending…' : when}
														</div>
													</div>
												</div>
											);
										})}
									</div>

									<div className="space-y-2 border-t border-gray-700 pt-3">
										<Textarea
											value={chatBody}
											onChange={(e) => setChatBody(e.target.value)}
											onKeyDown={(e) => {
												// Send message on Ctrl+Enter
												if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
													e.preventDefault();
													if (chatBody.trim() && !chatSending) {
														handleSendChat();
													}
												}
											}}
											placeholder="Type a message… (Ctrl+Enter to send)"
											rows={2}
											className="resize-none"
										/>
										<div className="flex items-center justify-between gap-2">
											<Button variant="outline" size="sm" onClick={() => setChatUser(null)}>
												← Back
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
