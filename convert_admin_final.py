#!/usr/bin/env python3
"""
Convert AdminDashboard from Tabs to conditional sidebar navigation.
This script makes all necessary changes to convert the admin dashboard
from horizontal tabs to a vertical sidebar with conditional rendering.
"""

import re

# Read the file
with open('src/app/pages/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Join all lines
content = ''.join(lines)

# 1. Remove Tabs import
content = content.replace(
    "import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';\n",
    ""
)

# 2. Update lucide imports to include FileText if not present
if "FileText" not in content[:1000]:  # Check in imports section
    content = content.replace(
        "import { ArrowLeft, BookOpen, Plus, Settings, TrendingUp, Users, Video } from 'lucide-react';",
        "import { ArrowLeft, BookOpen, FileText, Plus, Settings, TrendingUp, Users, Video } from 'lucide-react';"
    )

# 3. Find and replace the entire Tabs section with sidebar
tabs_section_start = content.find('\t\t<Tabs\n\t\t\tvalue={activeTab}')
if tabs_section_start > 0:
    # Find the end of TabsList
    tabs_list_end = content.find('\t\t\t</TabsList>\n\n\t\t\t<TabsContent value="analytics"', tabs_section_start)
    if tabs_list_end > 0:
        # Get the part before Tabs
        before_tabs = content[:tabs_section_start]
        # Find the TabsContent start for analytics
        analytics_start = content.find('<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">', tabs_list_end)
        
        if analytics_start > 0:
            # Create the new sidebar structure
            sidebar = '''\t\t<div className="flex gap-6 min-h-screen">
\t\t\t{/* Sidebar Navigation */}
\t\t\t<div className="w-64 bg-slate-100 dark:bg-slate-900 rounded-lg p-6 h-fit sticky top-6 border border-slate-200 dark:border-slate-800">
\t\t\t\t<nav className="space-y-2">
\t\t\t\t\t{[
\t\t\t\t\t\t{ value: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
\t\t\t\t\t\t{ value: 'calendar', label: 'Calendar', icon: <Video className="w-4 h-4" /> },
\t\t\t\t\t\t{ value: 'announcements', label: 'Announcements', icon: <FileText className="w-4 h-4" /> },
\t\t\t\t\t\t{ value: 'users', label: 'User Management', icon: <Users className="w-4 h-4" /> },
\t\t\t\t\t\t{ value: 'courses', label: 'Class Management', icon: <BookOpen className="w-4 h-4" /> },
\t\t\t\t\t\t{ value: 'courseManagement', label: 'Course Management', icon: <Settings className="w-4 h-4" /> },
\t\t\t\t\t\t{ value: 'settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
\t\t\t\t\t].map((item) => (
\t\t\t\t\t\t<button
\t\t\t\t\t\t\tkey={item.value}
\t\t\t\t\t\t\tonClick={() => {
\t\t\t\t\t\t\t\tif (!isAdminTab(item.value)) return;
\t\t\t\t\t\t\t\tsetActiveTab(item.value as AdminTab);
\t\t\t\t\t\t\t\tsetDashboardSearchParam('tab', item.value);
\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\tclassName={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
\t\t\t\t\t\t\t\tactiveTab === item.value
\t\t\t\t\t\t\t\t\t? 'bg-blue-600 text-white'
\t\t\t\t\t\t\t\t\t: 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
\t\t\t\t\t\t\t}`}
\t\t\t\t\t\t>
\t\t\t\t\t\t\t{item.icon}
\t\t\t\t\t\t\t<span className="text-sm font-medium">{item.label}</span>
\t\t\t\t\t\t</button>
\t\t\t\t\t))}
\t\t\t\t</nav>
\t\t\t</div>

\t\t\t{/* Main Content */}
\t\t\t<div className="flex-1 space-y-6">
\t\t\t\t{activeTab === 'analytics' ? (
\t\t\t\t\t'''
            
            # Now build the full content with conditional rendering
            after_sidebar = sidebar
            
            # Get content from start of analytics grid to end of file
            rest_of_content = content[analytics_start:]
            
            # Replace each TabsContent closing and opening with ternary conditionals
            # </TabsContent>\n\n\t\t\t<TabsContent value="X"> -> ) : activeTab === 'X' ? (
            rest_of_content = re.sub(
                r'\t\t\t</TabsContent>\n\n\t\t\t<TabsContent value="calendar" className="space-y-6">',
                '\t\t\t\t) : activeTab === \'calendar\' ? (\n\t\t\t\t\t',
                rest_of_content
            )
            rest_of_content = re.sub(
                r'\t\t\t</TabsContent>\n\n\t\t\t<TabsContent value="announcements" className="space-y-6">',
                '\t\t\t\t) : activeTab === \'announcements\' ? (\n\t\t\t\t\t',
                rest_of_content
            )
            rest_of_content = re.sub(
                r'\t\t\t</TabsContent>\n\n\t\t\t<TabsContent value="messages" className="space-y-6">',
                '\t\t\t\t) : activeTab === \'messages\' ? (\n\t\t\t\t\t',
                rest_of_content
            )
            rest_of_content = re.sub(
                r'\t\t\t</TabsContent>\n\n\t\t\t<TabsContent value="users" className="space-y-6">',
                '\t\t\t\t) : activeTab === \'users\' ? (\n\t\t\t\t\t',
                rest_of_content
            )
            rest_of_content = re.sub(
                r'\t\t\t</TabsContent>\n\n\t\t\t<TabsContent value="courses" className="space-y-6">',
                '\t\t\t\t) : activeTab === \'courses\' ? (\n\t\t\t\t\t',
                rest_of_content
            )
            rest_of_content = re.sub(
                r'\t\t\t</TabsContent>\n\n\t\t\t<TabsContent value="courseManagement" className="space-y-6">',
                '\t\t\t\t) : activeTab === \'courseManagement\' ? (\n\t\t\t\t\t',
                rest_of_content
            )
            rest_of_content = re.sub(
                r'\t\t\t</TabsContent>\n\n\t\t\t<TabsContent value="settings" className="space-y-6">',
                '\t\t\t\t) : activeTab === \'settings\' ? (\n\t\t\t\t\t',
                rest_of_content
            )
            
            # Fix the final closing
            rest_of_content = re.sub(
                r'\t\t\t</TabsContent>\n\t\t</Tabs>',
                '\t\t\t\t) : null}\n\t\t\t</div>\n\t\t</div>',
                rest_of_content
            )
            
            # Rebuild content
            # Need to fix indentation - add one more tab to all content lines
            content_lines = rest_of_content.split('\n')
            fixed_lines = []
            for line in content_lines:
                if line.startswith('\t\t\t<') or line.startswith('\t\t\t\t'):
                    # Increase indentation by one tab
                    fixed_lines.append('\t' + line)
                else:
                    fixed_lines.append(line)
            rest_of_content = '\n'.join(fixed_lines)
            
            # Recombine everything
            content = before_tabs + after_sidebar + rest_of_content

# Write the modified content back
with open('src/app/pages/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ AdminDashboard.tsx converted successfully!")
print("  - Removed Tabs import")
print("  - Added FileText icon")
print("  - Replaced Tabs component with sidebar navigation")
print("  - Converted 7 TabsContent sections to conditional rendering")
