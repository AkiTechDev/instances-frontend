interface Region {
  value: string,
  label: string
};


export const regions: {[id: string]: string} = {
  'sa-east-1': 'Sao Paulo, sa-east-1',
  'us-east-1': 'N. Virginia',
  'us-east-2': 'Ohio, us-east-2',
  'us-west-1': 'N. California, us-west-1',
  'us-west-2': 'Oregon, us-west-2',
  'ap-south-1': 'Mumbai, ap-south-1',
  'ap-northeast-1': 'Tokyo, ap-northeast-1',
  'ap-northeast-2': 'Seoul, ap-northeast-2',
  'ap-southeast-1': 'Singapore, ap-southeast-1',
  'ap-southeast-2': 'Sydney, ap-southeast-2',
  'ca-central-1': 'Canada, ca-central-1',
  'eu-central-1': 'Frankfurt, eu-central-1',
  'eu-west-1': 'Ireland, eu-west-1',
  'eu-west-2': 'London, eu-west-2',
};