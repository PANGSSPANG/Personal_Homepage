export const locales = ['zh'] as const;
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
  skipToContent: string;
  menu: string;
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
    skipToContent: '跳到主要内容',
    menu: '菜单',
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
};
