export type ImageCategory = "os" | "database" | "webserver" | "language" | "application";

export interface CatalogImage {
  name: string;
  displayName: string;
  description: string;
  category: ImageCategory;
  officialImage: boolean;
  popularTags: string[];
  defaultTag: string;
  defaults: {
    ports: { container: number; host: number; protocol: "tcp" | "udp" }[];
    volumes: { container: string; name: string }[];
    env: {
      key: string;
      value: string;
      required: boolean;
      secret: boolean;
      description: string;
    }[];
    size: string;
  };
}

export const IMAGE_CATEGORIES: { id: ImageCategory; label: string }[] = [
  { id: "os", label: "Operating Systems" },
  { id: "database", label: "Databases" },
  { id: "webserver", label: "Web Servers" },
  { id: "language", label: "Languages & Runtimes" },
  { id: "application", label: "Applications" },
];

export const IMAGE_CATALOG: CatalogImage[] = [
  // --- Operating Systems ---
  {
    name: "ubuntu",
    displayName: "Ubuntu",
    description: "Popular Linux distribution",
    category: "os",
    officialImage: true,
    popularTags: ["24.04", "22.04", "20.04", "latest"],
    defaultTag: "24.04",
    defaults: {
      ports: [],
      volumes: [],
      env: [],
      size: "nano",
    },
  },
  {
    name: "alpine",
    displayName: "Alpine Linux",
    description: "Lightweight Linux (5MB)",
    category: "os",
    officialImage: true,
    popularTags: ["3.21", "3.20", "3.19", "latest"],
    defaultTag: "3.21",
    defaults: {
      ports: [],
      volumes: [],
      env: [],
      size: "nano",
    },
  },
  {
    name: "debian",
    displayName: "Debian",
    description: "Stable and reliable Linux",
    category: "os",
    officialImage: true,
    popularTags: ["bookworm", "bullseye", "bookworm-slim", "latest"],
    defaultTag: "bookworm",
    defaults: {
      ports: [],
      volumes: [],
      env: [],
      size: "nano",
    },
  },
  {
    name: "rockylinux",
    displayName: "Rocky Linux",
    description: "Enterprise Linux, CentOS successor",
    category: "os",
    officialImage: true,
    popularTags: ["9", "9-minimal", "8", "latest"],
    defaultTag: "9",
    defaults: {
      ports: [],
      volumes: [],
      env: [],
      size: "nano",
    },
  },
  {
    name: "fedora",
    displayName: "Fedora",
    description: "Cutting-edge Linux",
    category: "os",
    officialImage: true,
    popularTags: ["41", "40", "39", "latest"],
    defaultTag: "41",
    defaults: {
      ports: [],
      volumes: [],
      env: [],
      size: "nano",
    },
  },

  // --- Databases ---
  {
    name: "postgres",
    displayName: "PostgreSQL",
    description: "Advanced relational database",
    category: "database",
    officialImage: true,
    popularTags: ["17", "16", "15", "17-alpine", "16-alpine", "latest"],
    defaultTag: "17",
    defaults: {
      ports: [{ container: 5432, host: 5432, protocol: "tcp" }],
      volumes: [{ container: "/var/lib/postgresql/data", name: "pgdata" }],
      env: [
        { key: "POSTGRES_PASSWORD", value: "", required: true, secret: true, description: "Superuser password (required)" },
        { key: "POSTGRES_USER", value: "postgres", required: false, secret: false, description: "Superuser name (default: postgres)" },
        { key: "POSTGRES_DB", value: "postgres", required: false, secret: false, description: "Default database name" },
      ],
      size: "medium",
    },
  },
  {
    name: "mysql",
    displayName: "MySQL",
    description: "Popular relational database",
    category: "database",
    officialImage: true,
    popularTags: ["9.0", "8.4", "8.0", "latest"],
    defaultTag: "9.0",
    defaults: {
      ports: [{ container: 3306, host: 3306, protocol: "tcp" }],
      volumes: [{ container: "/var/lib/mysql", name: "mysqldata" }],
      env: [
        { key: "MYSQL_ROOT_PASSWORD", value: "", required: true, secret: true, description: "Root password (required)" },
        { key: "MYSQL_DATABASE", value: "", required: false, secret: false, description: "Database to create on startup" },
        { key: "MYSQL_USER", value: "", required: false, secret: false, description: "Additional user to create" },
        { key: "MYSQL_PASSWORD", value: "", required: false, secret: true, description: "Password for additional user" },
      ],
      size: "medium",
    },
  },
  {
    name: "mariadb",
    displayName: "MariaDB",
    description: "MySQL-compatible database",
    category: "database",
    officialImage: true,
    popularTags: ["11", "10.11", "10.6", "latest"],
    defaultTag: "11",
    defaults: {
      ports: [{ container: 3306, host: 3306, protocol: "tcp" }],
      volumes: [{ container: "/var/lib/mysql", name: "mariadbdata" }],
      env: [
        { key: "MARIADB_ROOT_PASSWORD", value: "", required: true, secret: true, description: "Root password (required)" },
        { key: "MARIADB_DATABASE", value: "", required: false, secret: false, description: "Database to create on startup" },
        { key: "MARIADB_USER", value: "", required: false, secret: false, description: "Additional user to create" },
        { key: "MARIADB_PASSWORD", value: "", required: false, secret: true, description: "Password for additional user" },
      ],
      size: "medium",
    },
  },
  {
    name: "mongo",
    displayName: "MongoDB",
    description: "Document-oriented NoSQL database",
    category: "database",
    officialImage: true,
    popularTags: ["8.0", "7.0", "6.0", "latest"],
    defaultTag: "8.0",
    defaults: {
      ports: [{ container: 27017, host: 27017, protocol: "tcp" }],
      volumes: [{ container: "/data/db", name: "mongodata" }],
      env: [
        { key: "MONGO_INITDB_ROOT_USERNAME", value: "admin", required: false, secret: false, description: "Root username" },
        { key: "MONGO_INITDB_ROOT_PASSWORD", value: "", required: false, secret: true, description: "Root password" },
      ],
      size: "medium",
    },
  },
  {
    name: "redis",
    displayName: "Redis",
    description: "In-memory key-value store",
    category: "database",
    officialImage: true,
    popularTags: ["7", "7-alpine", "6", "latest"],
    defaultTag: "7-alpine",
    defaults: {
      ports: [{ container: 6379, host: 6379, protocol: "tcp" }],
      volumes: [{ container: "/data", name: "redisdata" }],
      env: [],
      size: "small",
    },
  },
  {
    name: "elasticsearch",
    displayName: "Elasticsearch",
    description: "Search and analytics engine",
    category: "database",
    officialImage: false,
    popularTags: ["8.17.0", "8.16.0", "7.17.27"],
    defaultTag: "8.17.0",
    defaults: {
      ports: [
        { container: 9200, host: 9200, protocol: "tcp" },
        { container: 9300, host: 9300, protocol: "tcp" },
      ],
      volumes: [{ container: "/usr/share/elasticsearch/data", name: "esdata" }],
      env: [
        { key: "discovery.type", value: "single-node", required: false, secret: false, description: "Cluster discovery type" },
        { key: "xpack.security.enabled", value: "false", required: false, secret: false, description: "Enable security features" },
      ],
      size: "large",
    },
  },

  // --- Web Servers ---
  {
    name: "nginx",
    displayName: "Nginx",
    description: "High-performance web server",
    category: "webserver",
    officialImage: true,
    popularTags: ["1.27", "1.27-alpine", "stable-alpine", "latest"],
    defaultTag: "1.27-alpine",
    defaults: {
      ports: [{ container: 80, host: 8080, protocol: "tcp" }],
      volumes: [],
      env: [],
      size: "nano",
    },
  },
  {
    name: "httpd",
    displayName: "Apache HTTP",
    description: "Classic web server",
    category: "webserver",
    officialImage: true,
    popularTags: ["2.4", "2.4-alpine", "latest"],
    defaultTag: "2.4-alpine",
    defaults: {
      ports: [{ container: 80, host: 8080, protocol: "tcp" }],
      volumes: [],
      env: [],
      size: "nano",
    },
  },
  {
    name: "caddy",
    displayName: "Caddy",
    description: "Auto-HTTPS web server",
    category: "webserver",
    officialImage: true,
    popularTags: ["2", "2-alpine", "latest"],
    defaultTag: "2-alpine",
    defaults: {
      ports: [
        { container: 80, host: 8080, protocol: "tcp" },
        { container: 443, host: 8443, protocol: "tcp" },
      ],
      volumes: [{ container: "/data", name: "caddy_data" }],
      env: [],
      size: "nano",
    },
  },
  {
    name: "traefik",
    displayName: "Traefik",
    description: "Cloud-native reverse proxy",
    category: "webserver",
    officialImage: true,
    popularTags: ["v3.3", "v3.2", "v2.11", "latest"],
    defaultTag: "v3.3",
    defaults: {
      ports: [
        { container: 80, host: 80, protocol: "tcp" },
        { container: 8080, host: 8081, protocol: "tcp" },
      ],
      volumes: [],
      env: [],
      size: "small",
    },
  },

  // --- Languages & Runtimes ---
  {
    name: "node",
    displayName: "Node.js",
    description: "JavaScript runtime",
    category: "language",
    officialImage: true,
    popularTags: ["22", "22-alpine", "20", "20-alpine", "lts-alpine", "latest"],
    defaultTag: "22-alpine",
    defaults: {
      ports: [{ container: 3000, host: 3000, protocol: "tcp" }],
      volumes: [{ container: "/app", name: "nodeapp" }],
      env: [
        { key: "NODE_ENV", value: "production", required: false, secret: false, description: "Node environment" },
      ],
      size: "small",
    },
  },
  {
    name: "python",
    displayName: "Python",
    description: "Python runtime",
    category: "language",
    officialImage: true,
    popularTags: ["3.13", "3.13-slim", "3.12", "3.12-slim", "3.13-alpine", "latest"],
    defaultTag: "3.13-slim",
    defaults: {
      ports: [{ container: 8000, host: 8000, protocol: "tcp" }],
      volumes: [{ container: "/app", name: "pythonapp" }],
      env: [],
      size: "small",
    },
  },
  {
    name: "golang",
    displayName: "Go",
    description: "Go programming language",
    category: "language",
    officialImage: true,
    popularTags: ["1.23", "1.23-alpine", "1.22", "latest"],
    defaultTag: "1.23-alpine",
    defaults: {
      ports: [{ container: 8080, host: 8080, protocol: "tcp" }],
      volumes: [{ container: "/app", name: "goapp" }],
      env: [],
      size: "small",
    },
  },
  {
    name: "ruby",
    displayName: "Ruby",
    description: "Ruby runtime",
    category: "language",
    officialImage: true,
    popularTags: ["3.3", "3.3-slim", "3.3-alpine", "latest"],
    defaultTag: "3.3-slim",
    defaults: {
      ports: [{ container: 3000, host: 3000, protocol: "tcp" }],
      volumes: [{ container: "/app", name: "rubyapp" }],
      env: [],
      size: "small",
    },
  },
  {
    name: "php",
    displayName: "PHP",
    description: "PHP with Apache/FPM",
    category: "language",
    officialImage: true,
    popularTags: ["8.4-fpm", "8.4-apache", "8.3-fpm", "8.3-apache", "latest"],
    defaultTag: "8.4-fpm",
    defaults: {
      ports: [{ container: 9000, host: 9000, protocol: "tcp" }],
      volumes: [{ container: "/var/www/html", name: "phpapp" }],
      env: [],
      size: "small",
    },
  },
  {
    name: "openjdk",
    displayName: "OpenJDK",
    description: "Java development kit",
    category: "language",
    officialImage: true,
    popularTags: ["21", "21-slim", "17", "17-slim", "latest"],
    defaultTag: "21-slim",
    defaults: {
      ports: [{ container: 8080, host: 8080, protocol: "tcp" }],
      volumes: [{ container: "/app", name: "javaapp" }],
      env: [],
      size: "medium",
    },
  },

  // --- Applications ---
  {
    name: "wordpress",
    displayName: "WordPress",
    description: "Content management system",
    category: "application",
    officialImage: true,
    popularTags: ["6", "6-php8.3", "6-apache", "latest"],
    defaultTag: "6",
    defaults: {
      ports: [{ container: 80, host: 8080, protocol: "tcp" }],
      volumes: [{ container: "/var/www/html", name: "wpdata" }],
      env: [
        { key: "WORDPRESS_DB_HOST", value: "", required: true, secret: false, description: "Database hostname (e.g. db:3306)" },
        { key: "WORDPRESS_DB_USER", value: "wordpress", required: false, secret: false, description: "Database user" },
        { key: "WORDPRESS_DB_PASSWORD", value: "", required: true, secret: true, description: "Database password" },
        { key: "WORDPRESS_DB_NAME", value: "wordpress", required: false, secret: false, description: "Database name" },
      ],
      size: "small",
    },
  },
  {
    name: "ghost",
    displayName: "Ghost",
    description: "Publishing platform",
    category: "application",
    officialImage: true,
    popularTags: ["5", "5-alpine", "latest"],
    defaultTag: "5-alpine",
    defaults: {
      ports: [{ container: 2368, host: 2368, protocol: "tcp" }],
      volumes: [{ container: "/var/lib/ghost/content", name: "ghostdata" }],
      env: [
        { key: "url", value: "http://localhost:2368", required: false, secret: false, description: "Blog URL" },
      ],
      size: "small",
    },
  },
  {
    name: "nextcloud",
    displayName: "Nextcloud",
    description: "Self-hosted cloud storage",
    category: "application",
    officialImage: true,
    popularTags: ["30", "29", "30-apache", "latest"],
    defaultTag: "30",
    defaults: {
      ports: [{ container: 80, host: 8080, protocol: "tcp" }],
      volumes: [{ container: "/var/www/html", name: "nextclouddata" }],
      env: [],
      size: "medium",
    },
  },
  {
    name: "gitea/gitea",
    displayName: "Gitea",
    description: "Lightweight Git hosting",
    category: "application",
    officialImage: false,
    popularTags: ["1.22", "1.21", "latest"],
    defaultTag: "1.22",
    defaults: {
      ports: [
        { container: 3000, host: 3000, protocol: "tcp" },
        { container: 22, host: 2222, protocol: "tcp" },
      ],
      volumes: [{ container: "/data", name: "giteadata" }],
      env: [],
      size: "small",
    },
  },
  {
    name: "minio/minio",
    displayName: "MinIO",
    description: "S3-compatible object storage",
    category: "application",
    officialImage: false,
    popularTags: ["latest", "RELEASE.2024-12-18T13-15-44Z"],
    defaultTag: "latest",
    defaults: {
      ports: [
        { container: 9000, host: 9000, protocol: "tcp" },
        { container: 9001, host: 9001, protocol: "tcp" },
      ],
      volumes: [{ container: "/data", name: "miniodata" }],
      env: [
        { key: "MINIO_ROOT_USER", value: "minioadmin", required: false, secret: false, description: "Root access key" },
        { key: "MINIO_ROOT_PASSWORD", value: "", required: true, secret: true, description: "Root secret key (min 8 chars)" },
      ],
      size: "small",
    },
  },
];
