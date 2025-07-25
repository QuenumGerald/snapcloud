/**
 * Minimal MiniMax wrapper for SnapCloud
 * --------------------------------------
 * Fournit deux helpers :
 *   - splitSnapTasks(requirement): Promise<string[]>
 *   - generateArchitecture(tasks): Promise<{ diagramMermaid: string, cfnTemplate: string }>
 *
 * Nécessite la variable d'environnement :
 *   MINIMAX_API_KEY
 */
import fetch from "node-fetch";

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_API_URL = process.env.MINIMAX_API_URL || "https://api.minimax.io/v1/text/chatcompletion_v2";

if (!MINIMAX_API_KEY) {
  throw new Error("MINIMAX_API_KEY manquant dans l'environnement");
}

// Fonction utilitaire pour nettoyer les réponses MiniMax
function cleanMiniMaxResponse(response: string): string {
  // Supprimer les blocs de code markdown ```json...```
  let cleaned = response
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^[^\[\{]*/, '') // Supprimer tout avant le premier [ ou {
    .replace(/[^\]\}]*$/, '') // Supprimer tout après le dernier ] ou }
    .trim();
  
  // Si la réponse est tronquée, essayer de la compléter
  if (cleaned.endsWith(',') || (!cleaned.endsWith(']') && !cleaned.endsWith('}') && cleaned.includes('['))) {
    cleaned = cleaned.replace(/,$/, '') + ']';
  }
  
  return cleaned;
}

export async function splitSnapTasks(requirement: string): Promise<string[]> {
  // Version simplifiée pour les tests - TODO: améliorer le parsing MiniMax
  const defaultTasks = [
    "Initialiser le projet",
    "Configurer la base de données",
    "Créer les modèles de données",
    "Développer l'interface utilisateur",
    "Implémenter les API REST",
    "Ajouter l'authentification",
    "Configurer le déploiement",
    "Effectuer les tests"
  ];
  
  console.log(`[DEBUG] Splitting requirement: ${requirement}`);
  return defaultTasks;
}

export async function generateArchitecture(tasks: string[]): Promise<{ 
  diagramMermaid: string; 
  cfnTemplate: string; 
  costEstimation: {
    json: any;
    table: string;
  }
}> {
  console.log(`[DEBUG] Generating architecture for ${tasks.length} tasks`);
  
  // Version simplifiée pour les tests - TODO: implémenter MiniMax
  const diagramMermaid = `graph TD
    A["👤 Users"] --> B["⚖️ Application Load Balancer"]
    B --> C["🖥️ EC2 Auto Scaling Group"]
    C --> D["💾 RDS MySQL Database"]
    C --> E["📁 S3 Bucket (Static Assets)"]
    B --> F["🌐 CloudFront CDN"]
    F --> E
    C --> G["🔐 ElastiCache Redis"]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
    style F fill:#f1f8e9
    style G fill:#fff8e1`;
    
  const cfnTemplate = `AWSTemplateFormatVersion: '2010-09-09'
Description: 'Architecture AWS générée par SnapCloud'

Parameters:
  EnvironmentName:
    Description: Environment name prefix
    Type: String
    Default: snapcloud

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub \${EnvironmentName}-VPC

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub \${EnvironmentName}-ALB
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub \${EnvironmentName}-ASG
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref TargetGroup

  # RDS Database
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub \${EnvironmentName}-db
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      MasterUsername: admin
      MasterUserPassword: !Ref DatabasePassword
      AllocatedStorage: 20
      StorageType: gp2
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub \${EnvironmentName}-static-assets
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: false

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt S3Bucket.RegionalDomainName
            Id: S3Origin
            S3OriginConfig:
              OriginAccessIdentity: ''
        Enabled: true
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
          CachedMethods:
            - GET
            - HEAD
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub \${EnvironmentName}-ALB-DNS

  DatabaseEndpoint:
    Description: RDS instance endpoint
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub \${EnvironmentName}-DB-Endpoint`;
      
  // Estimation de coût simplifiée
  const costEstimation = {
    json: {
      "totalMonthlyCost": 156.50,
      "currency": "USD",
      "region": "us-east-1",
      "breakdown": [
        {
          "service": "EC2 Instances",
          "instanceType": "t3.micro",
          "quantity": 2,
          "hourlyCost": 0.0104,
          "monthlyCost": 15.00
        },
        {
          "service": "Application Load Balancer",
          "quantity": 1,
          "monthlyCost": 22.50
        },
        {
          "service": "RDS MySQL",
          "instanceType": "db.t3.micro",
          "storage": "20GB",
          "monthlyCost": 25.00
        },
        {
          "service": "S3 Storage",
          "storage": "100GB",
          "monthlyCost": 2.30
        },
        {
          "service": "CloudFront CDN",
          "dataTransfer": "1TB",
          "monthlyCost": 85.00
        },
        {
          "service": "ElastiCache Redis",
          "instanceType": "cache.t3.micro",
          "monthlyCost": 6.70
        }
      ]
    },
    table: `| Service | Type | Quantité | Coût Mensuel |
|---------|------|----------|---------------|
| EC2 Instances | t3.micro | 2 | $15.00 |
| Load Balancer | ALB | 1 | $22.50 |
| RDS MySQL | db.t3.micro | 20GB | $25.00 |
| S3 Storage | Standard | 100GB | $2.30 |
| CloudFront | CDN | 1TB transfer | $85.00 |
| ElastiCache | cache.t3.micro | 1 | $6.70 |
| **TOTAL** | | | **$156.50/mois** |`
  };
      
  return {
    diagramMermaid,
    cfnTemplate,
    costEstimation
  };
}

async function callMiniMax(prompt: string): Promise<any> {
  const body = {
    model: "MiniMax-M1",
    messages: [
      { role: "system", name: "MiniMax AI" },
      { role: "user", name: "user", content: prompt },
    ],
    max_tokens: 2048,
    temperature: 0.2,
    top_p: 0.95,
    mask_sensitive_info: false,
  };
  const res = await fetch(MINIMAX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`MiniMax API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  // Le texte généré est dans data.choices[0].message.content
  return data.choices?.[0]?.message?.content || data.result || data;
}

// Si tu veux tester en CLI :
if (import.meta.url === `file://${process.argv[1]}` && process.argv.length > 2) {
  (async () => {
    const requirement = process.argv.slice(2).join(" ");
    const tasks = await splitSnapTasks(requirement);
    console.log("Tâches :", tasks);
    const archi = await generateArchitecture(tasks);
    console.log("Diagramme :\n", archi.diagramMermaid);
    console.log("CFN :\n", archi.cfnTemplate);
  })();
}
