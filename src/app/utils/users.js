const DEFAULT_AVATAR_TYPE = 'olive';

const LOCATION_ALIASES = {
  'Читалка 4 этаж': 'НЛК',
  'Читалка, 4 этаж': 'НЛК',
  'Коворкинг 5-18': 'Технопарк',
  'Коворкинг': 'Технопарк',
  'Лаба фотоники': 'К-корпус',
  'Лаба, 3 корпус': 'Э-корпус',
  'ГЗ': 'Г-корпус',
  'ГЗ сектор Б': 'Г-корпус',
  'ГЗ, сектор Б': 'Г-корпус',
  'Столовая №1': 'Столовая НЛК',
  'Стадион МГУ': 'Футбольное поле',
  'Деканат': 'Студофис',
  'НИИЯФ': 'Э-корпус',
  'ОИЯИ': '45/44',
  'ОИЯИ Дубна': '45/44',
  'ВМК': '33/И-корпус',
  'Библиотека ГЗ': 'Г-корпус',
  'Лаба квантовых технологий': 'Р/31',
  'Общага ДАС/ГЗ': 'Общага',
  'м. Университет': 'КПП',
};

const TAG_RULES = [
  { label: 'ВышМат', match: ['матан', 'диффур', 'термех', 'тензор'] },
  { label: 'Физика', match: ['квант', 'физик', 'оптик', 'фотоник', 'спецкурс', 'лабы'] },
  { label: 'Программирование', match: ['python', 'c++', 'код', 'ml', 'data science', 'ds', 'hpc', 'параллел'] },
  { label: 'Стажировки', match: ['стаж', 'резюме', 'собес', 'кейс', 'карьер', 'консалт', 'продукт', 'стартап'] },
  { label: 'Документы', match: ['документ', 'академ', 'комис', 'грант', 'заявк', 'стипенд'] },
  { label: 'Адаптация', match: ['адаптац', 'общага', 'кампус', 'первокурс', 'жиль', 'быт'] },
  { label: 'Разговор', match: ['поддерж', 'выгора', 'психолог', 'разговор'] },
];

export function getInitials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '??'
  );
}

function normalizeLocation(location) {
  if (!location) {
    return 'Локация не указана';
  }

  return LOCATION_ALIASES[location] || location;
}

function buildDisplayTags(user) {
  if (Array.isArray(user.tags) && user.tags.length > 0) {
    return user.tags.slice(0, 2);
  }

  const rawTags = Array.isArray(user.tags_array) ? user.tags_array : [];
  const normalizedTags = rawTags.map((tag) => String(tag).toLowerCase());
  const matchedLabels = TAG_RULES.filter(({ match }) =>
    normalizedTags.some((tag) => match.some((pattern) => tag.includes(pattern)))
  ).map(({ label }) => label);

  if (matchedLabels.length > 0) {
    return [...new Set(matchedLabels)].slice(0, 2);
  }

  return rawTags.slice(0, 2).map((tag) => String(tag));
}

export function mapUserToCard(user) {
  return {
    id: user.id,
    name: user.full_name || user.name || 'Без имени',
    course: user.course || 1,
    faculty: user.department || user.faculty || '',
    bio: user.bio_raw || user.bio || 'Нет описания',
    tags: buildDisplayTags(user),
    location: normalizeLocation(user.location_name || user.location),
    avatar: user.avatar || getInitials(user.full_name || user.name),
    avatarType: user.avatarType || DEFAULT_AVATAR_TYPE,
    trustScore: user.trust_score ?? 5,
    helpedCount: user.helped_count ?? 0,
    telegram: user.telegram_username || null,
  };
}

export function formatCourseLabel(course) {
  return course ? `${course} курс` : 'Курс не указан';
}
