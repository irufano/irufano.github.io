export const REGEX_EXAMPLE = {
	pattern: '\\b[\\w.-]+@[\\w-]+\\.[a-zA-Z]{2,}\\b',
	flags: 'g',
	testString: 'Contact us at hello@irufano.dev or support@example.com for help.'
};

export const regexTesterState = $state({
	pattern: '',
	flags: 'g',
	testString: '',
	replacement: ''
});
