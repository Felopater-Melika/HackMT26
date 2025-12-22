"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const toggleTheme = () => {
		if (theme === "light") {
			setTheme("dark");
		} else if (theme === "dark") {
			setTheme("system");
		} else {
			setTheme("light");
		}
	};

	if (!mounted) {
		return (
			<Button
				variant="ghost"
				size="icon"
				className="h-9 w-9"
				aria-label="Toggle theme"
				disabled
			>
				<Sun className="h-4 w-4" />
			</Button>
		);
	}

	const getIcon = () => {
		if (theme === "light") {
			return <Sun className="h-4 w-4" />;
		}
		if (theme === "dark") {
			return <Moon className="h-4 w-4" />;
		}
		// System theme - show sun/moon based on current system preference
		const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		return isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggleTheme}
			className="h-9 w-9"
			aria-label="Toggle theme"
		>
			{getIcon()}
		</Button>
	);
}

