import React from 'react';

interface SidebarSection {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface NewSidebarComponentProps {
  sections: SidebarSection[];
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export const NewSidebarComponent: React.FC<NewSidebarComponentProps> = ({
  sections,
  activeSection,
  onSectionChange,
}) => {
  return (
    <aside className="lg:col-span-1">
      <div className="sticky top-24 space-y-2">
        <div className="bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border p-4">
          <nav className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === id
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}; 