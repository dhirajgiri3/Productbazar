'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ProjectProvider } from "@/lib/contexts/project-context";

export default function ProjectsLayout({ children }) {
  useEffect(() => {
    gsap.fromTo(
      '.projects-container',
      { 
        opacity: 0, 
        y: 30,
        scale: 0.98,
        filter: 'blur(10px)'
      },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'power4.out'
      }
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="projects-container max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </div>
    </div>
  );
}
