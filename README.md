<p align="center">
  <a href="https://www.uit.edu.vn/" title="Truong Dai hoc Cong nghe Thong tin" style="border: none;">
    <img src="https://i.imgur.com/WmMnSRt.png" alt="Truong Dai hoc Cong nghe Thong tin | University of Information Technology">
  </a>
</p>

<h1 align="center"><b>NETWORK AND SYSTEM ADMINISTRATION</b></h1>

## TEAM

| No  | Student ID | Name             | Email                  |
| --- | ---------- | ---------------- | ---------------------- |
| 1   | 22520315   | Le Duc Anh Duy   | 22520315@gm.uit.edu.vn |
| 2   | 24521790   | Tra Trong Tin    | 24521790@gm.uit.edu.vn |
| 3   | 24521877   | Duong Quoc Trung | 24521877@gm.uit.edu.vn |

## COURSE INFORMATION

- **Course Name:** Network & System Administration
- **Course Code:** NT132
- **Class Code:** NT132.Q22
- **Academic Year:** Semester 2 (2025-2026)
- **Instructor:** MSc. Bui Thanh Binh

---

## Project Overview

This repository demonstrates a basic DevOps workflow that provisions AWS infrastructure with Terraform, builds a React frontend with GitHub Actions, and configures/deploys the application to Amazon EC2 using Ansible. The solution emphasizes repeatable deployments and security best practices such as secret management with Ansible Vault and least-privilege access.

## Website:

foodie-uit-nt132.com

## Architecture Diagram

```
                              Developer
                                   |
             +---------------------+---------------------+
             |                                           |
     (1) Infra as Code                          (2) App Code
             |                                           |
             v                                           v
     Terraform code                           GitHub Repository
             |                                           |
             | terraform apply                           | git push
             v                                           v
+--------------------------------------+        +--------------------------------------+
| AWS Infrastructure                   |        | GitHub Actions (CI/CD)               |
|                                      |        |                                      |
| - Amazon EC2 (server)                |        | 1. Checkout code                     |
| - Application Load Balancer (ALB)    |        | 2. Setup Node.js                     |
| - Target Group                       |        | 3. Build React (-> build/)           |
| - Security Group                     |        | 4. SCP build -> EC2                  |
| - Route53 (domain DNS)               |        | 5. SSH -> run Ansible                |
| - Certificate Manager (ACM - SSL)    |        |                                      |
+---------------+----------------------+        | GitHub Secrets                       |
                |                               | -> SSH key, Vault password           |
                |                               +---------------+----------------------+
                |                                               |
                v                                               v
        +------------------------------------------------------------+
        | Ansible (CONFIG + DEPLOY + SECURITY CORE)                  |
        |                                                            |
        | inventory.ini -> localhost                                 |
        | group_vars/all.yml -> shared config                        |
        |                                                            |
        | Ansible Vault                                              |
        | -> stores encrypted secrets                                |
        | -> decrypts with GitHub Actions secret                     |
        |                                                            |
        | site.yml                                                   |
        |                                                            |
        | role: nginx                                                |
        |  - install nginx (yum)                                     |
        |  - deploy config (template .j2)                            |
        |  - validate config (nginx -t)                              |
        |  - restart nginx (handler)                                 |
        |                                                            |
        | role: app                                                  |
        |  - create deploy_path                                      |
        |  - copy React build -> /var/www/html                       |
        |  - set permissions (security)                              |
        |  - clean old files                                         |
        |                                                            |
        | Security:                                                  |
        |  - Vault (encrypted secrets)                               |
        |  - no hardcoded config                                     |
        |  - correct permissions                                     |
        |  - consistent deploys                                      |
        +---------------------------+--------------------------------+
                                    |
                                    v
                    +--------------------------------------+
                    | Amazon EC2                           |
                    |                                      |
                    | - OS: Amazon Linux 2                 |
                    | - Nginx (managed by Ansible)         |
                    | - React build: /var/www/html         |
                    |                                      |
                    | Security:                            |
                    |  - only accepts traffic from ALB     |
                    |  - controlled by Security Group      |
                    +--------------------------------------+
```

## Repository Structure

- ansible/ : Ansible playbooks, roles, and inventory
- frontend/ : React frontend source code and build outputs
- terraform/ : Terraform configuration for AWS infrastructure

## Prerequisites

- Terraform CLI
- Ansible
- Node.js (for building the frontend)
- AWS CLI credentials with sufficient permissions
- SSH access to the EC2 instance
- Ansible Vault password stored in GitHub Secrets for CI/CD

## Local Development (Frontend)

1. Install dependencies
   - `cd frontend`
   - `npm install`
2. Run the app
   - `npm start`

## Build and Deploy (CI/CD Summary)

1. Push code to the repository.
2. GitHub Actions builds the React app and uploads the build artifacts to EC2.
3. GitHub Actions runs Ansible to configure Nginx and deploy the build to `/var/www/html`.

## Security Notes

- Secrets are encrypted with Ansible Vault.
- SSH keys and Vault password are stored in GitHub Secrets.
- EC2 instance only accepts traffic from the ALB security group.

## Notes

- Update Terraform variables and Ansible inventory to match your AWS environment.
- Use `terraform apply` to provision infrastructure before running the Ansible deployment.
