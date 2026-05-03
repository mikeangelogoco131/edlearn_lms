#!/usr/bin/env python3
"""Simple AdminDashboard conversion using straightforward replacements."""

# Read the file
with open('src/app/pages/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Tabs import
content = content.replace(
    "import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';\n",
    ""
)

# 2. Add FileText icon
content = content.replace(
    "import { ArrowLeft, BookOpen, Plus, Settings, TrendingUp, Users, Video } from 'lucide-react';",
    "import { ArrowLeft, BookOpen, FileText, Plus, Settings, TrendingUp, Users, Video } from 'lucide-react';"
)

# 3. Replace entire Tabs opening through start of analytics content
old_tabs = '''<Tabs
			value={activeTab}
			onValueChange={(v) => {
				if (!isAdminTab(v)) return;
				setActiveTab(v);
				setDashboardSearchParam('tab', v);
			}}
			className="space-y-6"
		>
			<TabsList>
				<TabsTrigger value="analytics">Analytics</TabsTrigger>
				<TabsTrigger value="calendar">Calendar</TabsTrigger>
				<TabsTrigger value="announcements">Announcements</TabsTrigger>
				<TabsTrigger value="users">User Management</TabsTrigger>
				<TabsTrigger value="courses">Class Management</TabsTrigger>
				<TabsTrigger value="courseManagement">Course Management</TabsTrigger>
				<TabsTrigger value="settings">System Settings</TabsTrigger>
			</TabsList>

			<TabsContent value="analytics" className="space-y-6">'''

new_sidebar = '''<div className="flex gap-6 min-h-screen">
			{/* Sidebar Navigation */}
			<div className="w-64 bg-slate-100 dark:bg-slate-900 rounded-lg p-6 h-fit sticky top-6 border border-slate-200 dark:border-slate-800">
				<nav className="space-y-2">
					{[
						{ value: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
						{ value: 'calendar', label: 'Calendar', icon: <Video className="w-4 h-4" /> },
						{ value: 'announcements', label: 'Announcements', icon: <FileText className="w-4 h-4" /> },
						{ value: 'users', label: 'User Management', icon: <Users className="w-4 h-4" /> },
						{ value: 'courses', label: 'Class Management', icon: <BookOpen className="w-4 h-4" /> },
						{ value: 'courseManagement', label: 'Course Management', icon: <Settings className="w-4 h-4" /> },
						{ value: 'settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
					].map((item) => (
						<button
							key={item.value}
							onClick={() => {
								if (!isAdminTab(item.value)) return;
								setActiveTab(item.value as AdminTab);
								setDashboardSearchParam('tab', item.value);
							}}
							className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
								activeTab === item.value
									? 'bg-blue-600 text-white'
									: 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
							}`}
						>
							{item.icon}
							<span className="text-sm font-medium">{item.label}</span>
						</button>
					))}
				</nav>
			</div>

			{/* Main Content */}
			<div className="flex-1 space-y-6">
				{activeTab === 'analytics' ? ('''

content = content.replace(old_tabs, new_sidebar)

# 4. Replace TabsContent transitions to ternary conditionals
replacements = [
    ('</TabsContent>\n\n\t\t\t<TabsContent value="calendar" className="space-y-6">', 
     ') : activeTab === \'calendar\' ? ('),
    ('</TabsContent>\n\n\t\t\t<TabsContent value="announcements" className="space-y-6">', 
     ') : activeTab === \'announcements\' ? ('),
    ('</TabsContent>\n\n\t\t\t<TabsContent value="messages" className="space-y-6">', 
     ') : activeTab === \'messages\' ? ('),
    ('</TabsContent>\n\n\t\t\t<TabsContent value="users" className="space-y-6">', 
     ') : activeTab === \'users\' ? ('),
    ('</TabsContent>\n\n\t\t\t<TabsContent value="courses" className="space-y-6">', 
     ') : activeTab === \'courses\' ? ('),
    ('</TabsContent>\n\n\t\t\t<TabsContent value="courseManagement" className="space-y-6">', 
     ') : activeTab === \'courseManagement\' ? ('),
    ('</TabsContent>\n\n\t\t\t<TabsContent value="settings" className="space-y-6">', 
     ') : activeTab === \'settings\' ? ('),
]

for old, new in replacements:
    content = content.replace(old, new)

# 5. Replace final closing
content = content.replace(
    '\t\t\t</TabsContent>\n\t\t</Tabs>',
    '\t\t\t) : null}\n\t\t\t</div>\n\t\t</div>'
)

# Write back
with open('src/app/pages/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Conversion complete!")
