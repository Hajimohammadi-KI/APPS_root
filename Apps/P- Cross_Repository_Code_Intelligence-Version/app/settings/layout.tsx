import "./settings-base.css";
import "./settings-module.css";
import "./settings-modern.css";

export default function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
