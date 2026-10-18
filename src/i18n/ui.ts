export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export interface UIStrings {
  siteName: string;
  nav: {
    home: string;
    experience: string;
    skills: string;
  };
  labels: {
    present: string;
    backToExperience: string;
    viewCase: string;
    fallbackBadge: string;
    email: string;
    location: string;
    updated: string;
    years: string;
    resume: string;
  };
  headings: {
    about: string;
    selectedWork: string;
    toolkit: string;
    allExperience: string;
    allSkills: string;
    contact: string;
  };
  kinds: {
    work: string;
    project: string;
    education: string;
  };
  switchLabel: string;
  switchAria: string;
  skipToContent: string;
  menu: string;
  fallbackNotice: string;
  sampleNotice: string;
  intro: {
    experience: string;
    skills: string;
  };
  cta: {
    experience: string;
    skills: string;
  };
  notFound: {
    title: string;
    body: string;
    back: string;
  };
  footer: string;
}

export const ui: Record<Locale, UIStrings> = {
  zh: {
    siteName: '个人主页',
    nav: {
      home: '信息',
      experience: '经历',
      skills: '能力',
    },
    labels: {
      present: '至今',
      backToExperience: '返回经历',
      viewCase: '查看案例',
      fallbackBadge: '中文',
      email: '邮箱',
      location: '所在地',
      updated: '更新于',
      years: '年',
      resume: '简历 PDF',
    },
    headings: {
      about: '关于我',
      selectedWork: '精选项目',
      toolkit: '能力概览',
      allExperience: '全部经历',
      allSkills: '全部能力',
      contact: '联系',
    },
    kinds: {
      work: '工作',
      project: '项目',
      education: '教育',
    },
    switchLabel: 'EN',
    switchAria: '切换到英文',
    skipToContent: '跳到主要内容',
    menu: '菜单',
    fallbackNotice: '本条目暂无英文版，以下为中文原文。',
    sampleNotice: '示例内容，待替换',
    intro: {
      experience: '工作、项目与教育经历，按开始时间从近到远排列。项目可以点开看完整案例。',
      skills: '按类别整理的技术能力，包含熟练度与使用年限。',
    },
    cta: {
      experience: '看看经历',
      skills: '浏览能力',
    },
    notFound: {
      title: '页面不存在',
      body: '这个地址没有对应的页面，可能是链接过期或输入有误。',
      back: '回到首页',
    },
    footer: '用 Astro 构建的静态主页',
  },
  en: {
    siteName: 'Personal site',
    nav: {
      home: 'About',
      experience: 'Experience',
      skills: 'Skills',
    },
    labels: {
      present: 'Present',
      backToExperience: 'Back to experience',
      viewCase: 'View case study',
      fallbackBadge: '中文',
      email: 'Email',
      location: 'Location',
      updated: 'Updated',
      years: 'yrs',
      resume: 'Résumé PDF',
    },
    headings: {
      about: 'About',
      selectedWork: 'Selected work',
      toolkit: 'Toolkit',
      allExperience: 'All experience',
      allSkills: 'All skills',
      contact: 'Contact',
    },
    kinds: {
      work: 'Work',
      project: 'Project',
      education: 'Education',
    },
    switchLabel: '中文',
    switchAria: 'Switch to Chinese',
    skipToContent: 'Skip to content',
    menu: 'Menu',
    fallbackNotice: 'This entry is not translated yet. The Chinese original is shown below.',
    sampleNotice: 'Sample content — replace before publishing.',
    intro: {
      experience:
        'Work, projects and education, newest first. Project entries open into full case studies.',
      skills: 'Technical skills grouped by category, with level and years of use.',
    },
    cta: {
      experience: 'View experience',
      skills: 'Browse skills',
    },
    notFound: {
      title: 'Page not found',
      body: 'There is nothing at this address. The link may be out of date.',
      back: 'Back home',
    },
    footer: 'A static site built with Astro',
  },
};
