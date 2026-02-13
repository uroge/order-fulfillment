import { DataSource } from 'typeorm';

type BuildDataSourceOptions = {
  databaseUrl: string | undefined;
  entitiesGlob: string | string[];
  migrationsGlob: string | string[];
};

export function buildDataSource(options: BuildDataSourceOptions) {
  if (!options.databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  return new DataSource({
    type: 'postgres',
    url: options.databaseUrl,
    entities: Array.isArray(options.entitiesGlob)
      ? options.entitiesGlob
      : [options.entitiesGlob],
    migrations: Array.isArray(options.migrationsGlob)
      ? options.migrationsGlob
      : [options.migrationsGlob],
    synchronize: false,
  });
}
