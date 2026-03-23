import { useStats } from '@/hooks/useStats';
import { Layout } from '@/components/Layout';
import { ValidatorProfile } from '@/components/ValidatorProfile';

export default function ValidatorPage() {
  const { stats } = useStats();

  return (
    <Layout stats={stats}>
      <ValidatorProfile />
    </Layout>
  );
}
