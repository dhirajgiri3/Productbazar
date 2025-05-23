"use client";

import React from 'react';
import { FiBriefcase, FiAward, FiTag, FiCalendar, FiBook } from 'react-icons/fi';
import SelectableTagsField from '../SelectableTagsField';

// Common skills for jobseekers
const jobseekerSkills = [
  "JavaScript", "React", "Node.js", "Python", "Java", "C++", "C#", "PHP", "Ruby", "Swift",
  "Kotlin", "Go", "Rust", "TypeScript", "HTML", "CSS", "SQL", "MongoDB", "Firebase", "AWS",
  "Azure", "Google Cloud", "Docker", "Kubernetes", "DevOps", "UI/UX Design", "Graphic Design",
  "Product Management", "Project Management", "Digital Marketing", "SEO", "Content Writing",
  "Data Analysis", "Machine Learning", "AI", "Blockchain", "Mobile Development", "Game Development",
  "Quality Assurance", "Testing", "Cybersecurity", "Network Administration", "System Administration",
  "Database Administration", "Business Analysis", "Scrum", "Agile", "Leadership", "Communication",
  "Problem Solving", "Critical Thinking", "Teamwork", "Time Management", "Adaptability"
];

const JobseekerForm = ({ formData, handleChange, formErrors, FormField }) => {
  // Options for select fields
  const experienceLevelOptions = [
    { value: "Entry Level", label: "Entry Level" },
    { value: "Junior", label: "Junior" },
    { value: "Mid-Level", label: "Mid-Level" },
    { value: "Senior", label: "Senior" },
    { value: "Executive", label: "Executive" }
  ];

  // Initialize arrays if they don't exist
  const safeFormData = {
    ...formData,
    skills: formData.skills || [],
    education: formData.education || [],
    workExperience: formData.workExperience || [],
    certifications: formData.certifications || []
  };

  // Handle adding a new education entry
  const handleAddEducation = () => {
    const newEducation = [...safeFormData.education, {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startYear: new Date().getFullYear() - 4,
      endYear: new Date().getFullYear()
    }];

    handleChange({
      target: {
        name: 'education',
        value: newEducation
      }
    });
  };

  // Handle removing an education entry
  const handleRemoveEducation = (index) => {
    const newEducation = [...safeFormData.education];
    newEducation.splice(index, 1);

    handleChange({
      target: {
        name: 'education',
        value: newEducation
      }
    });
  };

  // Handle education field change
  const handleEducationChange = (index, field, value) => {
    const newEducation = [...safeFormData.education];
    newEducation[index][field] = value;

    handleChange({
      target: {
        name: 'education',
        value: newEducation
      }
    });
  };

  // Handle adding a new work experience entry
  const handleAddWorkExperience = () => {
    const newWorkExperience = [...safeFormData.workExperience, {
      company: '',
      position: '',
      description: '',
      startDate: '',
      endDate: '',
      current: false
    }];

    handleChange({
      target: {
        name: 'workExperience',
        value: newWorkExperience
      }
    });
  };

  // Handle removing a work experience entry
  const handleRemoveWorkExperience = (index) => {
    const newWorkExperience = [...safeFormData.workExperience];
    newWorkExperience.splice(index, 1);

    handleChange({
      target: {
        name: 'workExperience',
        value: newWorkExperience
      }
    });
  };

  // Handle work experience field change
  const handleWorkExperienceChange = (index, field, value) => {
    const newWorkExperience = [...safeFormData.workExperience];

    if (field === 'current' && value === true) {
      newWorkExperience[index].endDate = '';
    }

    newWorkExperience[index][field] = value;

    handleChange({
      target: {
        name: 'workExperience',
        value: newWorkExperience
      }
    });
  };

  // Handle adding a new certification
  const handleAddCertification = () => {
    const newCertifications = [...safeFormData.certifications, {
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expirationDate: ''
    }];

    handleChange({
      target: {
        name: 'certifications',
        value: newCertifications
      }
    });
  };

  // Handle removing a certification
  const handleRemoveCertification = (index) => {
    const newCertifications = [...safeFormData.certifications];
    newCertifications.splice(index, 1);

    handleChange({
      target: {
        name: 'certifications',
        value: newCertifications
      }
    });
  };

  // Handle certification field change
  const handleCertificationChange = (index, field, value) => {
    const newCertifications = [...safeFormData.certifications];
    newCertifications[index][field] = value;

    handleChange({
      target: {
        name: 'certifications',
        value: newCertifications
      }
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <FormField
          label="Job Title"
          name="jobTitle"
          value={safeFormData.jobTitle || ''}
          onChange={handleChange}
          error={formErrors.jobTitle}
          icon={FiBriefcase}
          placeholder="e.g., Software Developer"
          description="Your current or desired job title"
        />

        <FormField
          label="Experience Level"
          name="experience"
          type="select"
          value={safeFormData.experience || 'Mid-Level'}
          onChange={handleChange}
          error={formErrors.experience}
          options={experienceLevelOptions}
          icon={FiAward}
          description="Your overall experience level"
        />

        <div className="md:col-span-2">
          <div className="mb-5">
            <div className="flex justify-between items-start mb-1">
              <label className="block text-sm font-medium text-left text-gray-700">Skills</label>
            </div>
            <p className="text-xs text-gray-500 mb-1.5 text-left">Your professional skills</p>
            <SelectableTagsField
              name="skills"
              value={safeFormData.skills || []}
              onChange={handleChange}
              error={formErrors.skills}
              placeholder="Add skill and press Enter"
              icon={FiTag}
              presetOptions={jobseekerSkills}
              description="Select from common skills or add your own"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700 text-left">Education</h4>
          <button
            type="button"
            onClick={handleAddEducation}
            className="px-3 py-1 text-xs bg-violet-50 text-violet-700 rounded-md hover:bg-violet-100 transition-colors flex items-center"
          >
            <span className="mr-1">+</span> Add Education
          </button>
        </div>

        {safeFormData.education.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-md text-gray-500 text-sm">
            No education entries added yet. Click "Add Education" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {safeFormData.education.map((edu, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-gray-700">Education #{index + 1}</h5>
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(index)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  <FormField
                    label="Institution"
                    name={`education[${index}].institution`}
                    value={edu.institution || ''}
                    onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                    error={formErrors[`education[${index}].institution`]}
                    icon={FiBook}
                    placeholder="e.g., Harvard University"
                    description="Name of the educational institution"
                  />

                  <FormField
                    label="Degree"
                    name={`education[${index}].degree`}
                    value={edu.degree || ''}
                    onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                    error={formErrors[`education[${index}].degree`]}
                    icon={FiAward}
                    placeholder="e.g., Bachelor of Science"
                    description="Type of degree earned"
                  />

                  <FormField
                    label="Field of Study"
                    name={`education[${index}].fieldOfStudy`}
                    value={edu.fieldOfStudy || ''}
                    onChange={(e) => handleEducationChange(index, 'fieldOfStudy', e.target.value)}
                    error={formErrors[`education[${index}].fieldOfStudy`]}
                    icon={FiBook}
                    placeholder="e.g., Computer Science"
                    description="Your major or concentration"
                  />

                  <div className="grid grid-cols-2 gap-x-3">
                    <FormField
                      label="Start Year"
                      name={`education[${index}].startYear`}
                      type="number"
                      value={edu.startYear || ''}
                      onChange={(e) => handleEducationChange(index, 'startYear', e.target.value)}
                      error={formErrors[`education[${index}].startYear`]}
                      icon={FiCalendar}
                      placeholder="e.g., 2018"
                      description="Year started"
                    />

                    <FormField
                      label="End Year"
                      name={`education[${index}].endYear`}
                      type="number"
                      value={edu.endYear || ''}
                      onChange={(e) => handleEducationChange(index, 'endYear', e.target.value)}
                      error={formErrors[`education[${index}].endYear`]}
                      icon={FiCalendar}
                      placeholder="e.g., 2022"
                      description="Year completed"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700 text-left">Work Experience</h4>
          <button
            type="button"
            onClick={handleAddWorkExperience}
            className="px-3 py-1 text-xs bg-violet-50 text-violet-700 rounded-md hover:bg-violet-100 transition-colors flex items-center"
          >
            <span className="mr-1">+</span> Add Experience
          </button>
        </div>

        {safeFormData.workExperience.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-md text-gray-500 text-sm">
            No work experience entries added yet. Click "Add Experience" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {safeFormData.workExperience.map((exp, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-gray-700">Experience #{index + 1}</h5>
                  <button
                    type="button"
                    onClick={() => handleRemoveWorkExperience(index)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  <FormField
                    label="Company"
                    name={`workExperience[${index}].company`}
                    value={exp.company || ''}
                    onChange={(e) => handleWorkExperienceChange(index, 'company', e.target.value)}
                    error={formErrors[`workExperience[${index}].company`]}
                    icon={FiBriefcase}
                    placeholder="e.g., Google"
                    description="Company name"
                  />

                  <FormField
                    label="Position"
                    name={`workExperience[${index}].position`}
                    value={exp.position || ''}
                    onChange={(e) => handleWorkExperienceChange(index, 'position', e.target.value)}
                    error={formErrors[`workExperience[${index}].position`]}
                    icon={FiBriefcase}
                    placeholder="e.g., Software Engineer"
                    description="Your job title"
                  />

                  <FormField
                    label="Start Date"
                    name={`workExperience[${index}].startDate`}
                    type="date"
                    value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleWorkExperienceChange(index, 'startDate', e.target.value)}
                    error={formErrors[`workExperience[${index}].startDate`]}
                    icon={FiCalendar}
                    description="When you started this position"
                  />

                  <div className="flex flex-col">
                    <FormField
                      label="End Date"
                      name={`workExperience[${index}].endDate`}
                      type="date"
                      value={exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleWorkExperienceChange(index, 'endDate', e.target.value)}
                      error={formErrors[`workExperience[${index}].endDate`]}
                      icon={FiCalendar}
                      description="When you left this position"
                      disabled={exp.current}
                    />

                    <div className="mt-2">
                      <FormField
                        label=""
                        name={`workExperience[${index}].current`}
                        type="checkbox"
                        value={exp.current || false}
                        onChange={(e) => handleWorkExperienceChange(index, 'current', e.target.checked)}
                        placeholder="I currently work here"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      label="Description"
                      name={`workExperience[${index}].description`}
                      type="textarea"
                      value={exp.description || ''}
                      onChange={(e) => handleWorkExperienceChange(index, 'description', e.target.value)}
                      error={formErrors[`workExperience[${index}].description`]}
                      icon={FiBriefcase}
                      placeholder="Describe your responsibilities and achievements..."
                      description="Brief description of your role and accomplishments"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700 text-left">Certifications</h4>
          <button
            type="button"
            onClick={handleAddCertification}
            className="px-3 py-1 text-xs bg-violet-50 text-violet-700 rounded-md hover:bg-violet-100 transition-colors flex items-center"
          >
            <span className="mr-1">+</span> Add Certification
          </button>
        </div>

        {safeFormData.certifications.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-md text-gray-500 text-sm">
            No certifications added yet. Click "Add Certification" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {safeFormData.certifications.map((cert, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-gray-700">Certification #{index + 1}</h5>
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(index)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  <FormField
                    label="Certification Name"
                    name={`certifications[${index}].name`}
                    value={cert.name || ''}
                    onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                    error={formErrors[`certifications[${index}].name`]}
                    icon={FiAward}
                    placeholder="e.g., AWS Certified Solutions Architect"
                    description="Name of the certification"
                  />

                  <FormField
                    label="Issuing Organization"
                    name={`certifications[${index}].issuingOrganization`}
                    value={cert.issuingOrganization || ''}
                    onChange={(e) => handleCertificationChange(index, 'issuingOrganization', e.target.value)}
                    error={formErrors[`certifications[${index}].issuingOrganization`]}
                    icon={FiBriefcase}
                    placeholder="e.g., Amazon Web Services"
                    description="Organization that issued the certification"
                  />

                  <FormField
                    label="Issue Date"
                    name={`certifications[${index}].issueDate`}
                    type="date"
                    value={cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleCertificationChange(index, 'issueDate', e.target.value)}
                    error={formErrors[`certifications[${index}].issueDate`]}
                    icon={FiCalendar}
                    description="When you received this certification"
                  />

                  <FormField
                    label="Expiration Date"
                    name={`certifications[${index}].expirationDate`}
                    type="date"
                    value={cert.expirationDate ? new Date(cert.expirationDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleCertificationChange(index, 'expirationDate', e.target.value)}
                    error={formErrors[`certifications[${index}].expirationDate`]}
                    icon={FiCalendar}
                    description="When this certification expires (if applicable)"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobseekerForm;
