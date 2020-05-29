export const GET_LIMIT = 10;

export const API_PATH = '/api/v2';

export const protocol = {
  HTTP: 'http://',
  HTTPS: 'https://',
};

export const bugsLevel = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor',
};

export const slackCode = {
  HOPE: '[HOPE]',
  MY_SILOAM: '[MY_SILOAM]',
};

export const images = {
  [bugsLevel.CRITICAL]: 'https://platform.slack-edge.com/img/default_application_icon.png',
  [bugsLevel.MAJOR]: 'https://platform.slack-edge.com/img/default_application_icon.png',
  [bugsLevel.MINOR]: 'https://platform.slack-edge.com/img/default_application_icon.png',
};

export const colors = {
  [bugsLevel.CRITICAL]: '#D00000',
  [bugsLevel.MAJOR]: '#E6C74D',
  [bugsLevel.MINOR]: '#A33F90',
};

export const lookupOneKey = {
  ADMISSION_TYPE: 'ATP',
  GENDER: 'SEX',
  TITLE: 'TIT',
  RELIGION: 'REL',
  BLOOD_TYPE: 'BLO',
  CHANNEL_TYPE: 'CHA',
  NATIONALID_TYPE: 'NID',
  NOTIFICATION: 'NOT',
  MARITAL_STATUS: 'MAR',
  PATIENT_TYPE: 'PAT',
  REFERRAL_TYPE: 'REF',
  ADL: 'ADL',
  CONTACT_STATUS: 'CON',
  MSG: 'MSG',
  RELATIONSHIP_TYPE: 'RLS',
  STA: 'STA',
  STP: 'STP',
};

export const lookupTwoKey = {
  DOCTOR_TYPE: 'DOT',
  SCHEDULE_TYPE: 'STY',
  SCHEDULE_REPETITION: 'SRE',
  DOCTOR_HOSPITAL_TYPE: 'DOH',
  HOS: 'HOS',
  DOC: 'DOC',
  SCHEDULE_STATUS: 'SST',
  QUEUE_TYPE: 'QTY',
  QUEUE_STATUS: 'QST',
};

export const channel = {
  CALL_CENTER: '1',
  FRONT_OFFICE: '2',
  NURSE: '3',
  DOCTOR: '4',
  MOBILE: '5',
  WEBSITE: '6',
  CHATBOT: '7',
};
