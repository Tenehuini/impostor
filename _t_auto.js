const a = JSON.stringify(state.categories);
// usuario nuevo
const fresh = DEFAULT_CATEGORY_IDS.includes('dante');
// Marcar todas no toca dante
state.categories = []; $('#cat-toggle-all').click(); const afterAll = state.categories.includes('dante');
document.title = 'MIGRATED=' + a + ' defaultHasDante=' + fresh + ' toggleAllHasDante=' + afterAll;
