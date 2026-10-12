pipeline {
    agent any

    environment {
        IMAGE_FRONTEND = "techstore-frontend"
        IMAGE_BACKEND = "techstore-backend"
        SERVER_HOST = "103.20.96.174" // Thay bằng IP Server VPS của bạn
        SERVER_USER = "root"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-cred',
                    usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    
                    // Build Frontend Image
                    sh "docker build -t docker.io/$DOCKER_USER/$IMAGE_FRONTEND:latest ."
                    
                    // Build Backend Image
                    sh "docker build -t docker.io/$DOCKER_USER/$IMAGE_BACKEND:latest ./backend"
                }
            }
        }

        stage('Push Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-cred',
                    usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    
                    sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                    sh "docker push docker.io/$DOCKER_USER/$IMAGE_FRONTEND:latest"
                    sh "docker push docker.io/$DOCKER_USER/$IMAGE_BACKEND:latest"
                }
            }
        }

        stage('Deploy Server') {
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'dockerhub-cred',
                        usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                    file(credentialsId: 'docker-compose-file', variable: 'DOCKER_COMPOSE_PATH')
                ]) {
                    sshagent(credentials: ['server-ssh-key']) {
                        sh '''
                        # Copy docker-compose.yml từ Jenkins sang Server Deploy
                        scp -o StrictHostKeyChecking=no $DOCKER_COMPOSE_PATH $SERVER_USER@$SERVER_HOST:~/project/docker-compose.yml
                        
                        # SSH vào Server để pull image mới và khởi động lại container
                        ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
                        cd ~/project && \
                        echo \\"$DOCKER_PASS\\" | docker login -u $DOCKER_USER --password-stdin && \
                        docker compose pull && \
                        docker compose down && \
                        docker compose up -d && \
                        docker image prune -f
                        "
                        '''
                    }
                }
            }
        }
    }
}
