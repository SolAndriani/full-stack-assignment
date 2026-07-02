const { NextResponse } = require('next/server');

/**
 * Blocks destructive actions when the app is running in demo mode.
 * Returns a NextResponse (403) if blocked, or null if the action is allowed.
 */
function checkDemoModeForDestructiveAction(actionName) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (isDemoMode) {
    return NextResponse.json(
      {
        error: `This action (${actionName}) is disabled in demo mode.`,
        code: 'DEMO_MODE_BLOCKED',
      },
      { status: 403 },
    );
  }

  return null;
}

exports.checkDemoModeForDestructiveAction = checkDemoModeForDestructiveAction;