export type AesMode = 'encrypt' | 'decrypt';
export type AesKeySize = 128 | 192 | 256;

export const aesEncryptionState = $state({
	mode: 'encrypt' as AesMode,
	keySize: 256 as AesKeySize,
	iterations: 100000,
	inputText: '',
	outputText: ''
});
