import crypto from 'crypto';

const iv = Buffer.from('0102030405060708');
const presetKey = Buffer.from('0CoJUm6Qyw8W8jud');
const linuxapiKey = Buffer.from('rFgB&h#%2?^eDg:Q');
const base62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const publicKey = `
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB
-----END PUBLIC KEY-----
`;

const eapiKey = 'e82ckenh8dichen8';

const aesEncrypt = (buffer: Buffer, mode: string, key: any, iv: any): Buffer => {
  const cipher = crypto.createCipheriv('aes-128-' + mode, key, iv);
  return Buffer.concat([cipher.update(buffer), cipher.final()]);
};

const rsaEncrypt = (buffer: Buffer, key: string): Buffer => {
  buffer = Buffer.concat([Buffer.alloc(128 - buffer.length), buffer]);
  return crypto.publicEncrypt({ key: key, padding: crypto.constants.RSA_NO_PADDING }, buffer);
};

interface WeapiResult {
  params: string;
  encSecKey: string;
}

const weapi = (object: any) => {
  const text = JSON.stringify(object);
  const secretKey = crypto.randomBytes(16).map((n) => base62.charAt(n % 62).charCodeAt(0));

  return {
    params: aesEncrypt(
      Buffer.from(
        aesEncrypt(Buffer.from(text), 'cbc', presetKey, iv).toString('base64'),
      ),
      'cbc',
      secretKey,
      iv,
    ).toString('base64'),
    encSecKey: rsaEncrypt(Buffer.from(secretKey.reverse()), publicKey).toString('hex'),
  };
};

interface LinuxapiResult {
  eparams: string;
}

const linuxapi = (object: any): LinuxapiResult => {
  const text = JSON.stringify(object);
  return {
    eparams: aesEncrypt(Buffer.from(text), 'ecb', linuxapiKey, '')
      .toString('hex')
      .toUpperCase(),
  };
};

interface EapiResult {
  params: string;
}

const eapi = (url: string, object: any): EapiResult => {
  const text = typeof object === 'object' ? JSON.stringify(object) : object;
  const message = `nobody${url}use${text}md5forencrypt`;
  const digest = crypto.createHash('md5').update(message).digest('hex');
  const data = `${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}`;

  return {
    params: aesEncrypt(Buffer.from(data), 'ecb', eapiKey, '')
      .toString('hex')
      .toUpperCase(),
  };
};

const decrypt = (cipherBuffer: Buffer): Buffer => {
  const decipher = crypto.createDecipheriv('aes-128-ecb', eapiKey, '');
  return Buffer.concat([decipher.update(cipherBuffer), decipher.final()]);
};

export { weapi, linuxapi, eapi, decrypt };
