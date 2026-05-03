#!/usr/bin/env python3
"""
Convert AdminDashboard from Tabs/TabsContent to conditional rendering with sidebar
"""

import re

# Read the file
with open('src/app/pages/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Step 1: Remove Tabs/TabsList/TabsTrigger imports
content = re.sub(
    r"import \{ Tabs, TabsContent, TabsList, TabsTrigger \} from '\.\./components/ui/tabs';\n",
    "",
    content
)

# Step 2: Add FileText icon to imports if not present
if 'FileText' not in content.split('from \'lucide-react\'')[0]:
    content = content.replace(
        'import { ArrowLeft, BookOpen, Plus, Settings, TrendingUp, Users, Video } from \'lucide-react\';',
        'import { ArrowLeft, BookOpen, FileText, Plus, Settings, TrendingUp, Users, Video } from \'lucide-react\';'
    )

# Step 3: Replace the Tabs opening
tabs_opening = '''			<Tabs
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

new_sidebar = '''			<div className="flex gap-6 min-h-screen">
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
				<div className="flex-1">
					{activeTab === 'analytics' && ('''

content = content.replace(tabs_opening, new_sidebar)

# Step 4: Replace all closing TabsContent with closing braces
# Replace </TabsContent> followed by more content
content = re.sub(
    r'\t\t\t\t</TabsContent>\n\n\t\t\t\t<TabsContent value="calendar"',
    '\t\t\t\t)}\n\n\t\t\t\t{activeTab === \'calendar\' && (',
    content
)

content = re.sub(
    r'\t\t\t\t</TabsContent>\n\n\t\t\t\t<TabsContent value="announcements"',
    '\t\t\t\t)}\n\n\t\t\t\t{activeTab === \'announcements\' && (',
    content
)

content = re.sub(
    r'\t\t\t\t</TabsContent>\n\n\t\t\t\t<TabsContent value="messages"',
    '\t\t\t\t)}\n\n\t\t\t\t{activeTab === \'messages\' && (',
    content
)

content = re.sub(
    r'\t\t\t\t</TabsContent>\n\n\t\t\t\t<TabsContent value="users"',
    '\t\t\t\t)}\n\n\t\t\t\t{activeTab === \'users\' && (',
    content
)

content = re.sub(
    r'\t\t\t\t</TabsContent>\n\n\t\t\t\t<TabsContent value="courses"',
    '\t\t\t\t)}\n\n\t\t\t\t{activeTab === \'courses\' && (',
    content
)

content = re.sub(
    r'\t\t\t\t</TabsContent>\n\n\t\t\t\t<TabsContent value="courseManagement"',
    '\t\t\t\t)}\n\n\t\t\t\t{activeTab === \'courseManagement\' && (',
    content
)

content = re.sub(
    r'\t\t\t\t</TabsContent>\n\n\t\t\t\t<TabsContent value="settings"',
    '\t\t\t\t)}\n\n\t\t\t\t{activeTab === \'settings\' && (',
    content
)

# Step 5: Replace final closing tags
content = re.sub(
    r'\t\t\t\t</TabsContent>\n\t\t\t</Tabs>\n\t\t</DashboardLayout>',
    '\t\t\t\t)}\n\t\t\t</div>\n\t\t</div>\n\t\t</DashboardLayout>',
    content
)

# Write the file back
with open('src/app/pages/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("AdminDashboard.tsx converted successfully!")
