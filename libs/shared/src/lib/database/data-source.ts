import { DataSource } from 'typeorm';

type BuildDataSourceOptions = {
  databaseUrl: string | undefined;
  entitiesGlob: string;
  migrationsGlob: string;
};

export function buildDataSource(options: BuildDataSourceOptions) {
  if (!options.databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  return new DataSource({
    type: 'postgres',
    url: options.databaseUrl,
    entities: [options.entitiesGlob],
    migrations: [options.migrationsGlob],
    synchronize: false,
  });
}
