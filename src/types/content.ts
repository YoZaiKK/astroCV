export interface Profile {
	name: string;
	email: string;
	githubUrl: string | null;
	leetcodeUrl: string | null;
	linkedinUrl: string | null;
	resumeUrl: string | null;
	portraitUrl: string | null;
}

export interface ExperienceEntry {
	id: string;
	company: string;
	startDate: string;
	endDate: string | null;
	contentKey: string;
	highlightIds: string[];
	technologies: string[];
	focusAreas?: Array<{
		id: string;
		contentKey: string;
		status: string;
		technologies: string[];
	}>;
}

export interface Project {
	id: string;
	contentKey: string;
	category: string;
	filterTags: string[];
	status: string;
	published?: boolean;
	featured: boolean;
	technologies: string[];
	proposedTechnologies?: string[];
	sourceUrl: string | null;
	demoUrl: string | null;
	imageUrl: string | null;
	caseStudyPath: string | null;
	reviewBeforePublishing?: string[];
}

export interface PortfolioData {
	schemaVersion: number;
	locale: string;
	profile: Profile;
	experience: ExperienceEntry[];
	education: {
		institution: string;
		university: string;
		completedDate: string;
		degreeKey: string;
		completionKey: string;
		languages: Array<{ languageKey: string; levelKey: string }>;
	};
	skills: {
		core: string[];
		additional: Record<string, string[]>;
		growth: string[];
	};
	projects: Project[];
}
