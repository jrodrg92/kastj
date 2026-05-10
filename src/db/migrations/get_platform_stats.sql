-- Function to calculate platform statistics on the server side
-- This avoids fetching all proposals to the client and handles BigInt math correctly
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSONB AS $$
DECLARE
  stats RECORD;
BEGIN
  SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status IN ('active', '0')) AS active,
    COUNT(*) FILTER (WHERE status IN ('succeeded', '1')) AS succeeded,
    COUNT(*) FILTER (WHERE status IN ('failed', '2')) AS failed,
    COALESCE(SUM(
      CASE 
        WHEN decimals < 18 THEN (total_raised::numeric * (10 ^ (18 - decimals)))
        WHEN decimals > 18 THEN (total_raised::numeric / (10 ^ (decimals - 18)))
        ELSE total_raised::numeric
      END
    ), 0) / (10 ^ 18) AS raised
  INTO stats
  FROM proposals;

  RETURN jsonb_build_object(
    'total', stats.total,
    'active', stats.active,
    'succeeded', stats.succeeded,
    'failed', stats.failed,
    'raised', ROUND(stats.raised::numeric, 4) -- Keep 4 decimals for the summary
  );
END;
$$ LANGUAGE plpgsql STABLE;
