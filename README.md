# KaiOS GPS Location Sharer

This app allows you to share your live location from a KaiOS device through SMS, to anyone with a computer, phone, laptop, or another KaiOS device.

## Backend

The backend is an API Gateway REST API that talks to a AWS lambda, which saves the location data in a DynamoDB table, with an expiration column of 1 hour from entry.

## Frontend

KaiOS web application that allows for directional key usage. I actually chose the color purple before I realized every vibe-coded app uses that color, so my bad.