import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/services/api';

interface Step2Props {
  fullName: string;
  setFullName: (name: string) => void;
  parsedData?: any;
  userId?: string | null;
}

interface ExperienceItem {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  summary: string;
}

interface EducationItem {
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}

const Step2: React.FC<Step2Props> = ({ fullName, setFullName, parsedData, userId }) => {
  // Personal info
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  // Skills and links
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');

  // Experience
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [newExp, setNewExp] = useState<ExperienceItem>({ company: '', role: '', startDate: '', endDate: '', summary: '' });

  // Education
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [newEdu, setNewEdu] = useState<EducationItem>({ institution: '', degree: '', startDate: '', endDate: '' });

  // Prefill from parsedData
  useEffect(() => {
    const d = parsedData || {};
    const hasKeys = d && (d.full_name || d.email || d.skills || d.links || d.experience || d.education);
    if (!hasKeys) return;
    try {
      if (typeof d.full_name === 'string') setFullName(d.full_name);
      if (typeof d.email === 'string') setEmail(d.email);
      if (typeof d.phone === 'string') setPhone(d.phone);
      if (typeof d.location === 'string') setLocation(d.location);
      if (Array.isArray(d.skills)) setSkills(d.skills.filter((x: any) => typeof x === 'string'));
      if (Array.isArray(d.links)) setLinks(d.links.filter((x: any) => typeof x === 'string'));
      if (Array.isArray(d.experience)) {
        const exp: ExperienceItem[] = d.experience.map((e: any) => ({
          company: e.company || '',
          role: e.role || '',
          startDate: e.start_date || e.startDate || '',
          endDate: e.end_date || e.endDate || '',
          summary: e.summary || '',
        }));
        setExperiences(exp);
      }
      if (Array.isArray(d.education)) {
        const edu: EducationItem[] = d.education.map((e: any) => ({
          institution: e.institution || '',
          degree: e.degree || '',
          startDate: e.start_date || e.startDate || '',
          endDate: e.end_date || e.endDate || '',
        }));
        setEducation(edu);
      }
    } catch (err) {
      console.warn('Failed to prefill from parsedData', err);
    }
  }, [parsedData]);

  // Fallback: fetch uploads/<userId>/info.json when parsedData is empty
  useEffect(() => {
    const needsFetch = (!parsedData || Object.keys(parsedData || {}).length === 0) && userId;
    if (!needsFetch) return;
    const url = `${BACKEND_URL}/uploads/${userId}/info.json`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => {
        if (!d) return;
        try {
          if (typeof d.full_name === 'string') setFullName(d.full_name);
          if (typeof d.email === 'string') setEmail(d.email);
          if (typeof d.phone === 'string') setPhone(d.phone);
          if (typeof d.location === 'string') setLocation(d.location);
          if (Array.isArray(d.skills)) setSkills(d.skills.filter((x: any) => typeof x === 'string'));
          if (Array.isArray(d.links)) setLinks(d.links.filter((x: any) => typeof x === 'string'));
          if (Array.isArray(d.experience)) {
            const exp: ExperienceItem[] = d.experience.map((e: any) => ({
              company: e.company || '',
              role: e.role || '',
              startDate: e.start_date || e.startDate || '',
              endDate: e.end_date || e.endDate || '',
              summary: e.summary || '',
            }));
            setExperiences(exp);
          }
          if (Array.isArray(d.education)) {
            const edu: EducationItem[] = d.education.map((e: any) => ({
              institution: e.institution || '',
              degree: e.degree || '',
              startDate: e.start_date || e.startDate || '',
              endDate: e.end_date || e.endDate || '',
            }));
            setEducation(edu);
          }
        } catch (err) {
          console.warn('Failed to prefill from info.json', err);
        }
      })
      .catch((err) => {
        console.warn('info.json not found or failed to load', err);
      });
  }, [parsedData, userId]);

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    setSkills((prev) => [...prev, v]);
    setSkillInput('');
  };
  const removeSkill = (i: number) => setSkills((prev) => prev.filter((_, idx) => idx !== i));

  const addLink = () => {
    const v = linkInput.trim();
    if (!v) return;
    setLinks((prev) => [...prev, v]);
    setLinkInput('');
  };
  const removeLink = (i: number) => setLinks((prev) => prev.filter((_, idx) => idx !== i));

  const addExperience = () => {
    if (!newExp.company || !newExp.role) return;
    setExperiences((prev) => [...prev, newExp]);
    setNewExp({ company: '', role: '', startDate: '', endDate: '', summary: '' });
  };
  const removeExperience = (i: number) => setExperiences((prev) => prev.filter((_, idx) => idx !== i));

  const addEducation = () => {
    if (!newEdu.institution || !newEdu.degree) return;
    setEducation((prev) => [...prev, newEdu]);
    setNewEdu({ institution: '', degree: '', startDate: '', endDate: '' });
  };
  const removeEducation = (i: number) => setEducation((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    // Persist name to parent; other fields can be wired later
    setFullName(fullName.trim());
    // Simple feedback in console for now
    console.log('Saved resume draft', { fullName, email, phone, location, skills, links, experiences, education });
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setLocation('');
    setSkills([]);
    setLinks([]);
    setExperiences([]);
    setEducation([]);
    setSkillInput('');
    setLinkInput('');
    setNewExp({ company: '', role: '', startDate: '', endDate: '', summary: '' });
    setNewEdu({ institution: '', degree: '', startDate: '', endDate: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary mb-1">Resume Editor</h1>
        <p className="text-sm text-muted-foreground">Update your professional information</p>
      </div>

      {/* Personal Information */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-indigo-700 border-b border-indigo-200 pb-2">Personal Information</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aleks Ludkee"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. a.ludkee@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                className="w-full rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. (123) 456-7890"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input
              type="text"
              className="w-full rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Nashville, TN"
            />
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-indigo-700 border-b border-indigo-200 pb-2">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {skills.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs">
              {s}
              <button className="w-4 h-4 rounded-full bg-white/30 text-white text-[10px]" onClick={() => removeSkill(i)}>×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Add a skill (e.g. React.js)"
          />
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm" onClick={addSkill}>Add</button>
        </div>
      </section>

      {/* Links */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-indigo-700 border-b border-indigo-200 pb-2">Links</h2>
        <div className="flex flex-wrap gap-2">
          {links.map((l, i) => (
            <span key={i} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs">
              {l}
              <button className="w-4 h-4 rounded-full bg-white/30 text-white text-[10px]" onClick={() => removeLink(i)}>×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Add a link (e.g. github.com/username)"
          />
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm" onClick={addLink}>Add</button>
        </div>
      </section>

      {/* Experience */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-indigo-700 border-b border-indigo-200 pb-2">Work Experience</h2>
        {experiences.map((exp, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-slate-800 text-sm">
                {exp.company} — {exp.role}
              </div>
              <div className="text-xs text-slate-500">
                {exp.startDate} – {exp.endDate}
              </div>
            </div>
            {exp.summary && (
              <p className="text-sm text-slate-700">{exp.summary}</p>
            )}
            <div className="flex gap-2">
              <button className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md text-xs" onClick={() => removeExperience(i)}>Remove</button>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            className="rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
            placeholder="Company"
            value={newExp.company}
            onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
          />
          <input
            type="text"
            className="rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
            placeholder="Role"
            value={newExp.role}
            onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
          />
          <input
            type="text"
            className="rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
            placeholder="Start Date"
            value={newExp.startDate}
            onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
          />
          <input
            type="text"
            className="rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
            placeholder="End Date"
            value={newExp.endDate}
            onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
          />
        </div>
        <textarea
          className="w-full rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
          placeholder="Summary"
          value={newExp.summary}
          onChange={(e) => setNewExp({ ...newExp, summary: e.target.value })}
        />
        <div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm" onClick={addExperience}>Add Experience</button>
        </div>
      </section>

      {/* Education */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-indigo-700 border-b border-indigo-200 pb-2">Education</h2>
        {education.map((edu, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-slate-800 text-sm">
                {edu.institution} — {edu.degree}
              </div>
              <div className="text-xs text-slate-500">
                {edu.startDate} – {edu.endDate}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md text-xs" onClick={() => removeEducation(i)}>Remove</button>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            className="rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
            placeholder="Institution"
            value={newEdu.institution}
            onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
          />
          <input
            type="text"
            className="rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
            placeholder="Degree"
            value={newEdu.degree}
            onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
          />
          <input
            type="text"
            className="rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
            placeholder="Start Date"
            value={newEdu.startDate}
            onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })}
          />
          <input
            type="text"
            className="rounded-md border-2 border-slate-200 px-3 py-2 text-sm bg-background focus:outline-none focus:border-indigo-500"
            placeholder="End Date"
            value={newEdu.endDate}
            onChange={(e) => setNewEdu({ ...newEdu, endDate: e.target.value })}
          />
        </div>
        <div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm" onClick={addEducation}>Add Education</button>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm" onClick={handleSave}>Save</button>
        <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-md text-sm" onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
};

export default Step2;