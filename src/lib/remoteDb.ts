import { createClient } from '@libsql/client';

export const remoteCalendarClient = createClient({
  url: 'libsql://icci-poetacortez.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAzNzYwODksImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwia2lkIjoidDN2T0g4UzZ3MHJ5bHpEaXZIdVJRX0ozZnpZdm5hcVdzWmNyMDZfdVpLZyIsInJpZCI6IjliODAzOWFhLWU3MTgtNGY4ZS04Yzg2LTU2NDM1OGYyNDhjOSJ9.ioiNX6i6OT_KaVHbCjn1Tvroeo3Edb6JwOZE-J9StDxbcUf97qSoy-6c28VRTzfdQJngAeEfpuG_zHCFIm72CA'
});
