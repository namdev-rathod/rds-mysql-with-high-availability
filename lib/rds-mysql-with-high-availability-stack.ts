import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_rds as rds } from "aws-cdk-lib";
import { AuroraMysqlEngineVersion, DatabaseClusterEngine } from 'aws-cdk-lib/aws-rds';
import { SecurityGroup, } from 'aws-cdk-lib/aws-ec2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { aws_logs as logs } from 'aws-cdk-lib';

 
export class RdsMysqlWithHighAvailabilityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
  super(scope, id, props);

 // Fetch existing VPC by ID (replace with your VPC ID)
  const vpc = ec2.Vpc.fromLookup(this, 'ND-VPC', {
    vpcId: 'vpc-0e0e20c7600fd9b59',
});

 // Create a security group and open MySQL port 3306
  const securityGroup = new SecurityGroup(this, 'RDS-SG', {
    securityGroupName: 'rds-sg',
    vpc,
    allowAllOutbound: true,
});

securityGroup.addIngressRule(ec2.Peer.ipv4("0.0.0.0/0"),ec2.Port.tcp(3306), 'Allow MySQL access from anywhere');

 // Create RDS Database - MySQL Aurora
  const rdscluster = new rds.DatabaseCluster(this, "testcluster", {
    defaultDatabaseName: "testdb",
    engine: DatabaseClusterEngine.auroraMysql({ version: AuroraMysqlEngineVersion.VER_3_04_0 }),
    instances: 2,
    deletionProtection: false,
    storageEncrypted: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    backup: { retention: cdk.Duration.days(1) },
    cloudwatchLogsRetention: logs.RetentionDays.ONE_DAY,
    instanceProps: {
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
    vpc,
    vpcSubnets: {
    subnetType: ec2.SubnetType.PUBLIC,    // to create database in private subnet change value to private
                                          // To create specific private subnet availabilityZones: ['ap-south-1a'], // Replace with your region AZ

},
  publiclyAccessible: true,   // to make database private make value 'false'
  autoMinorVersionUpgrade: true,
  securityGroups: [securityGroup],
},
  credentials: rds.Credentials.fromGeneratedSecret("dbadmin", {
  secretName: 'dbpassword',

  }),
});

}
}