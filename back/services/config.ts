import { Service, Inject } from 'typedi';
import path, { join } from 'path';
import config from '../config';
import { getFileContentByName } from '../config/util';
import { Response } from 'express';

@Service()
export default class ConfigService {
  constructor() {}

  public async getFile(filePath: string, res: Response) {
    let content = '';
    const avaliablePath = [config.rootPath, config.configPath].map((x) =>
      path.resolve(x, filePath),
    );

    if (
      config.blackFileList.includes(filePath) ||
      avaliablePath.every(
        (x) =>
          !x.startsWith(config.scriptPath) && !x.startsWith(config.configPath),
      ) ||
      !filePath
    ) {
      return res.send({ code: 403, message: '文件无法访问' });
    }

    if (filePath.startsWith('sample/')) {
      content = await getFileContentByName(join(config.rootPath, filePath));
    } else if (filePath.startsWith('data/scripts/')) {
      content = await getFileContentByName(join(config.rootPath, filePath));
    } else {
      content = await getFileContentByName(join(config.configPath, filePath));
    }

    res.send({ code: 200, data: content });
  }
}
