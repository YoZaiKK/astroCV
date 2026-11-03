import rawPortfolio from './portfolio.data.json';
import type { PortfolioData } from '../types/content';

export const portfolio = rawPortfolio as PortfolioData;
export const resumePath = '/resume/guillermo-cardona-resume.pdf';

export const publishedProjects = portfolio.projects.filter(
	(project) => project.published !== false,
);
