export const  MERMAID_DEFAULT_TEMPLATE = `graph TB
  subgraph DC_Kaunas [Kaunas Data Center]
    Router_1(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
    Router_2(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
    Firewall_1(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
  end

  subgraph DC_Vilnius [Vilnius Data Center]
    Switch_1(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
    Switch_2(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
    Server_1(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
    Server_2(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
  end
  
  %% Internal connections within Kaunas
  Router_1 -->|Data Flow| Router_2
  Router_1 -->|Security Pass| Firewall_1
  Router_2 -.->|Backup| Firewall_1
  
  %% Internal connections within Vilnius
  Switch_1 -->|Replicates| Server_1
  Switch_2 -->|Replicates| Server_2
  Server_1 -.->|Backup Data| Server_2
  
  %% Cross-Datacenter Connections
  Router_1 -->|Backup| Switch_1
  Router_2 -.->|Data Sync| Switch_2
  Firewall_1 -->|Secure Tunnel| Server_1
  Server_1 -.->|Secure Replication| Server_2

  %% Miscellaneous Connections
  Switch_1 -.->|Data Transfer| Router_2
  Switch_2 -->|Monitor| Router_1
  Router_2 -->|Security Sync| Server_1
  Server_2 -.->|Backup Sync| Router_1

  %% Class Definitions
  classDef active fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,font-weight:bold;
  classDef inactive fill:#F44336,stroke:#B71C1C,stroke-width:2px,opacity:0.6;
  classDef highUsage fill:#FFEB3B,stroke:#F57C00,stroke-width:2px;
  classDef warning fill:#FF5722,stroke:#D32F2F,stroke-width:2px;
  classDef lowDisk fill:#F44336,stroke:#B71C1C,stroke-width:2px;
  classDef lowCapacity fill:#FFC107,stroke:#FF9800,stroke-width:2px;
  classDef highPerformance fill:#3F51B5,stroke:#1A237E,stroke-width:2px;
  classDef alert fill:#FF9800,stroke:#F44336,stroke-width:2px;
  classDef unknown fill:#B0BEC5,stroke:#78909C,stroke-width:2px;
`