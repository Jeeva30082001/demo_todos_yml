pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'jeeva3008/todo_db:latest'
        GIT_REPO = 'https://github.com/Jeeva30082001/demo_todos_yml.git'
        GIT_BRANCH = 'main'
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
    }

    stages {
        stage('Clone Repository') {
            steps {
                echo 'Cloning GitHub repository...'
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO}"
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo 'Building Docker image...'
                    sh " docker build -t ${DOCKER_IMAGE} ."
                }
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}",
                        usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh """
                    echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin
                    """
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                echo 'Pushing Docker image to Docker Hub...'
                sh " docker push ${DOCKER_IMAGE}"
            }
        }

        stage('Deploy Docker Container') {
            steps {
                echo 'Deploying container from Docker Hub image...'
                sh """
                 docker pull ${DOCKER_IMAGE}
                 docker stop mycontainer || true
                 docker rm mycontainer || true
                 docker run -d --name mycontainer -p 8081:8080 ${DOCKER_IMAGE}
                """
            }
        }
    }

    post {
        always {
            echo 'Cleaning up...'
            sh "docker logout"
        }
        success {
            echo 'Deployment completed successfully!'
        }
        failure {
            echo 'Deployment failed.'
        }
    }
}
