import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requirePermission, PERMISSIONS, ROLES } from '../../src/config/rbac.config.js';

describe('RBAC Middleware Integration Tests', () => {
  it('Platform Scope: blocks non-platform user from platform permissions with 403', async () => {
    const middleware = requirePermission(PERMISSIONS.PLATFORM_VIEW);
    const req = {
      user: { id: 'usr-1', platformRole: null },
      headers: {},
      params: {},
    };
    let error = null;
    await middleware(req, {}, (err) => {
      error = err;
    });

    assert.ok(error);
    assert.equal(error.statusCode, 403);
  });

  it('Platform Scope: allows PLATFORM_OWNER bypass', async () => {
    const middleware = requirePermission(PERMISSIONS.PLATFORM_VIEW);
    const req = {
      user: { id: 'usr-owner', platformRole: ROLES.PLATFORM_OWNER },
      headers: {},
      params: {},
    };
    let calledNext = false;
    await middleware(req, {}, (err) => {
      if (!err) calledNext = true;
    });

    assert.equal(calledNext, true);
  });

  it('Org Scope: blocks unauthenticated requests with 401', async () => {
    const middleware = requirePermission(PERMISSIONS.ASSESSMENTS_CREATE);
    const req = { user: null };
    let error = null;
    await middleware(req, {}, (err) => {
      error = err;
    });

    assert.ok(error);
    assert.equal(error.statusCode, 401);
  });

  it('Org Scope: requires organization ID header when accessing org routes', async () => {
    const middleware = requirePermission(PERMISSIONS.ASSESSMENTS_CREATE);
    const req = {
      user: { id: 'usr-examiner', platformRole: null },
      headers: {},
      params: {},
    };
    let error = null;
    await middleware(req, {}, (err) => {
      error = err;
    });

    assert.ok(error);
    assert.equal(error.statusCode, 400);
  });
});
