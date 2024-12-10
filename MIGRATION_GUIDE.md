# ValueEx Migration Guide

This guide outlines the steps to migrate from the old project structure to the new organized structure.

## Directory Structure Changes

Old structure:
```
PROJECT/
└── (various files in root)
```

New structure:
```
ValueEx/
├── src/
│   ├── services/     # Business logic and core services
│   ├── utils/        # Utility functions and helpers
│   ├── config/       # Configuration files
│   └── types/        # TypeScript type definitions
├── prisma/           # Database schema and migrations
├── tests/            # Test files
└── .env              # Environment variables
```

## Migration Steps

1. **Environment Variables**
   - Copy your existing `.env` file to the new location
   - Update any paths in the `.env` file to reflect the new structure
   - Compare with `.env.example` to ensure all required variables are present

2. **Service Files**
   - Move all service files to `src/services/`
   - Update import paths in each file
   - Test each service after moving

3. **Database**
   - Copy Prisma schema to `prisma/` directory
   - Run `npx prisma generate` to update client
   - Test database connections

4. **Dependencies**
   - Install dependencies using `npm install`
   - Verify all packages are at correct versions
   - Test all external API connections

## Testing the Migration

1. Run the test suite:
   ```bash
   npm test
   ```

2. Test API connections:
   ```bash
   npm run test:connections
   ```

3. Verify environment variables:
   ```bash
   npm run test:env
   ```

## Common Issues

1. **Import Path Errors**
   - Update all relative imports to reflect new directory structure
   - Use path aliases when available

2. **Environment Variables**
   - Double-check all environment variables are properly set
   - Verify file paths are correct for the new structure

3. **Database Connections**
   - Update database connection strings if necessary
   - Regenerate Prisma client after moving schema

## Need Help?

If you encounter any issues during migration:
1. Check the logs in `src/utils/logger.ts`
2. Review error messages in the console
3. Verify all paths in configuration files

## Post-Migration Checklist

- [ ] All services are properly located in `src/services/`
- [ ] Environment variables are correctly set
- [ ] Database connections are working
- [ ] API integrations are functional
- [ ] All tests are passing
- [ ] No import path errors
- [ ] Logging is working correctly
- [ ] Rate limiting is properly configured
