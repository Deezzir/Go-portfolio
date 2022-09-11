FROM golang:1.19
RUN mkdir /app
ADD ./ /app/
WORKDIR /app 
COPY ../../../../../root/noxu-credentials/*.json /app/
RUN go build -o main main.go
CMD ["/app/main"]